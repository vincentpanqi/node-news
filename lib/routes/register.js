var utils = global.nodenews.utils;
var model = global.nodenews.model;


exports.path = '/register';

exports.post = function (req, res, next) {
  var username = utils.xss(req.body.username || '').trim();
  var password = req.body.password || '';
  var email = utils.xss(req.body.email || '').trim();
  if (username && password) {
    password = utils.encryptPassword(password);
    model.users.getByUsername(username, function (err, user) {
      if (err) return next(err);
      if (user) return next('This username is already exists!');
      var user = {
        username: username,
        password: password,
        email:    email,
        timestamp: Date.now() / 1000
      };
      model.users.add(user, function (err, user) {
        if (err) return next(err);
        if (!(user.id > 0)) return next('Create account fail!');
        // auto login
        req.session.user = user;
        res.redirect('/');
      });
    });
  } else {
    next('Username and password cannot be empty!');
  }
};