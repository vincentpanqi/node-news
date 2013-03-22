var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = require('../utils');
var xss = utils.xss;


exports.path = '/logout';

exports.get = function (req, res, next) {
  req.session.user = null;
  res.redirect('/');
};
