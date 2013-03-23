var utils = global.nodenews.utils;
var model = global.nodenews.model;
var define = global.nodenews.define;


exports.path = '/register';

exports.post = function (req, res, next) {
  var username = (req.body.username || '').trim();
  var password = req.body.password || '';
  var email = (req.body.email || '').trim();
  utils.check(username, 'Invalid username').regex(define.check.username);
  if (password.length < define.check.passwordLength) return next('Password is too sort.');
  if (email) utils.check(email, 'Invalid email.').isEmail();

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
