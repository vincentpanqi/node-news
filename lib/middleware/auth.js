/**
 * Authorize middleware
 */

module.exports = function () {
  var utils = require('../utils');

  var sendError = function (err) {
    var lines = err instanceof Error ? err.stack.split(/\r?\n/) : [err];
    var c = this.locals.context || newContext();
    c.setLocals('error', lines[0]);
    c.setLocals('stack', lines.slice(1).join('\n'));
    this.render('error');
  };
  
  var USER_URL = ['/submit', '/reply'];
  var checkUserURL = function (url) {
    return USER_URL.indexOf(url) === -1 ? false : true;
  };

  return function (req, res, next) {
    var context = res.locals.context = utils.newContext();
    res.sendError = sendError;
    if (req.session.user) {
      context.setLocals('user', req.session.user);
    } else if (checkUserURL(req.url)) {
      return res.redirect('/login');
    }
    next();
  };
};
