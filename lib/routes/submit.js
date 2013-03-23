var utils = global.nodenews.utils;
var model = global.nodenews.model;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var define = global.nodenews.define;


exports.path = '/submit';

exports.get = function (req, res, next) {
  res.render('submit');
};

exports.post = function (req, res, next) {
  var title = utils.xss(String(req.body.title || '')).trim();
  var url = utils.xss(String(req.body.url || '')).trim();
  var text = utils.xss(String(req.body.text || '')).trim();
  if (!title) return next('Title cannot be empty!');
  if (url) utils.check(url, 'Invalid URL').isUrl();

  var data = {
    title:      title,
    url:        url,
    user_id:    req.session.user.id,
    timestamp:  Date.now() / 1000
  };

  var updateCacheAndReturn = function () {
    cache.set(define.cache.posts + data.id, config.redis.ttl, data);
    cache.clear(define.cache.posts_list + '*');
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
          if (err) return next(err);
          if (!(content.id > 0)) return next('Submit fail!');
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
          if (err) return next(err);
          if (rows < 1) return next('Submit fail!');
          data = post;
          insertContent();
        });
      } else {
        model.posts.add(data, function (err, post) {
          if (err) return next(err);
          if (!(post.id > 0)) return next('Submit fail!');
          data = post;
          insertContent();
         });
      }
    });
  } else {
    model.posts.add(data, function (err, post) {
      if (err) return next(err);
      if (!(post.id > 0)) return next('Submit fail!');
      data = post;
      insertContent();
    });
  }
};