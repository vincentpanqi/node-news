var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = require('../utils');
var xss = utils.xss;


exports.path = '/posts';

exports.get = function (req, res, next) {
  var c = res.locals.context;
  var p = req.query.p;
  if (!(p > 0)) p = 1;
  c.setLocals('query_page', p);
  res.render('index');
};
