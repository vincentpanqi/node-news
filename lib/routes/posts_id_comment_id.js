var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = require('../utils');
var xss = utils.xss;


exports.path = '/posts/:id/:comment_id';

exports.get = function (req, res, next) {
  var c = res.locals.context;
  var id = req.params.id;
  c.setLocals('query_post_id', id);
  var comment_id = req.params.comment_id;
  c.setLocals('query_comment_id', comment_id);
  res.render('content');
};
