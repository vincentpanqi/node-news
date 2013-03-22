var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = require('../utils');
var xss = utils.xss;


exports.path = '/submit';

exports.get = function (req, res, next) {
  res.render('submit');
};

exports.post = function (req, res, next) {
  var title = xss(String(req.body.title || '')).trim();
  var url = xss(String(req.body.url || '')).trim();
  var text = xss(String(req.body.text || '')).trim();
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
      db.delete('contents', {post_id: data.id}, function (err, content) {
        db.insert('contents', {
          post_id:    data.id,
          content:    text,
          timestamp:  data.timestamp
        }, function (err, results) {
          if (err) return res.sendError(err);
          if (results.affectedRows < 1) return res.sendError('Submit fail!');
          updateCacheAndReturn();
        });
      });
    } else {
      updateCacheAndReturn();
    }
  };
  if (url) {
    db.getOne('posts', {url: url}, function (err, post) {
      // If the url is already exists, then update it
      if (post) {
        db.update('posts', {url: url}, data, function (err, results) {
          if (err) return res.sendError(err);
          if (results.affectedRows < 1) return res.sendError('Submit fail!');
          data.id = post.id;
          insertContent();
        });
      } else {
        db.insert('posts', data, function (err, results) {
          if (err) return res.sendError(err);
          if (results.affectedRows < 1) return res.sendError('Submit fail!');
          data.id = results.insertId;
          insertContent();
         });
      }
    });
  } else {
    db.insert('posts', data, function (err, results) {
      if (err) return res.sendError(err);
      if (results.affectedRows < 1) return res.sendError('Submit fail!');
      data.id = results.insertId;
      insertContent();
    });
  }
};