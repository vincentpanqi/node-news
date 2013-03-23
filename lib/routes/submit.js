var utils = require('../utils');
var model = global.nodenews.model;
var cache = global.nodenews.cache;
var config = global.nodenews.config;


exports.path = '/submit';

exports.get = function (req, res, next) {
  res.render('submit');
};

exports.post = function (req, res, next) {
  var title = utils.xss(String(req.body.title || '')).trim();
  var url = utils.xss(String(req.body.url || '')).trim();
  var text = utils.xss(String(req.body.text || '')).trim();
  if (!title) return res.sendError('Title cannot be empty!');
  var data = {
    title:      title,
    url:        url,
    user_id:    req.session.user.id,
    timestamp:  Date.now() / 1000
  };
  var updateCacheAndReturn = function () {
    cache.set('posts:' + data.id, config.redis.ttl, data);
    res.redirect('/');
  };
  var insertContent = function () {
    if (text) {
      model.contents.deleteByPostId(data.id, function (err, rows) {
        model.contents.add({
          post_id:    data.id,
          content:    text,
          timestamp:  data.timestamp
        }, function (err, content) {
          if (err) return res.sendError(err);
          if (!(content.id > 0)) return res.sendError('Submit fail!');
          updateCacheAndReturn();
        });
      });
    } else {
      updateCacheAndReturn();
    }
  };
  if (url) {
    model.posts.getByUrl(url, function (err, post) {
      // If the url is already exists, then update it
      if (post) {
        model.posts.updateByUrl(url, data, function (err, rows) {
          if (err) return res.sendError(err);
          if (rows < 1) return res.sendError('Submit fail!');
          data = post;
          insertContent();
        });
      } else {
        model.posts.add(data, function (err, post) {
          if (err) return res.sendError(err);
          if (!(post.id > 0)) return res.sendError('Submit fail!');
          data = post;
          insertContent();
         });
      }
    });
  } else {
    model.posts.add(data, function (err, post) {
      if (err) return res.sendError(err);
      if (!(post.id > 0)) return res.sendError('Submit fail!');
      data = post;
      insertContent();
    });
  }
};