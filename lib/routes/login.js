var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = require('../utils');
var xss = utils.xss;


exports.path = '/login';

exports.get = function (req, res, next) {
  res.render('login');
};

exports.post = function (req, res, next) {
  var username = String(req.body.username);
  var password = String(req.body.password);
  db.getOne('users', {username: username}, function (err, user) {
    if (err || !user) return res.sendError('User not exists!');
    if (utils.validatePassword(password, user.password)) {
      req.session.user = user;
      res.redirect('/');
    } else {
      res.sendError('Incorrect password!');
    }
  });
};
