var utils = global.nodenews.utils;
var model = global.nodenews.model;


exports.path = '/login';

exports.get = function (req, res, next) {
  res.render('login');
};

exports.post = function (req, res, next) {
  var username = String(req.body.username);
  var password = String(req.body.password);
  model.users.getByUsername(username, function (err, user) {
    if (err || !user) return next('User not exists!');
    if (utils.validatePassword(password, user.password)) {
      req.session.user = user;
      res.redirect('/');
    } else {
      next('Incorrect password!');
    }
  });
};
