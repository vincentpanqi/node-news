var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = require('../utils');
var xss = utils.xss;


exports.path = '/register';

exports.post = function (req, res, next) {
  var username = xss(req.body.username || '').trim();
  var password = req.body.password || '';
  var email = xss(req.body.email || '').trim();
  if (username && password) {
    password = utils.encryptPassword(password);
    db.getOne('users', {username: username}, function (err, user) {
      if (user) return res.sendError('This username is already exists!');
      user = {
        username: username,
        password: password,
        email:    email,
        timestamp: Date.now() / 1000
      };
      db.insert('users', user, function (err, results) {
        if (err) return res.sendError(err);
        if (results.affectedRows < 1) return res.sendError('Create account fail!');
        // auto login
        user.id = results.insertId;
        req.session.user = user;
        res.redirect('/');
      });
    });
  } else {
    res.sendError('Username and password cannot be empty!');
  }
};