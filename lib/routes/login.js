var utils = require('../utils');
var model = global.nodenews.model;


exports.path = '/login';

exports.get = function (req, res, next) {
  res.render('login');
};

exports.post = function (req, res, next) {
  var username = String(req.body.username);
  var password = String(req.body.password);
  model.users.getByUsername(username, function (err, user) {
    if (err || !user) return res.sendError('User not exists!');
    if (utils.validatePassword(password, user.password)) {
      req.session.user = user;
      res.redirect('/');
    } else {
      res.sendError('Incorrect password!');
    }
  });
};
