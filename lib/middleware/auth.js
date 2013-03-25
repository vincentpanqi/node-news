/**
 * Authorize middleware
 */

module.exports = function () {
  var utils = global.nodenews.utils;
  
  var USER_URL = ['/submit', '/reply'];
  var checkUserURL = function (url) {
    return USER_URL.indexOf(url) === -1 ? false : true;
  };

  return function (req, res, next) {
    var context = res.locals.context = utils.newContext();
    context.setLocals('query', req.query);
    if (req.session.user) {
      context.setLocals('user', req.session.user);
    } else if (checkUserURL(req.url)) {
      return res.redirect('/login');
    }
    next();
  };
};
