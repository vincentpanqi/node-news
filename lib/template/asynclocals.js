/**
 * Async locals
 */

var tinyliquid = require('tinyliquid');
var flow = require('bright-flow');
var utils = global.nodenews.utils;
var asyncFilters = require('./asyncfilters');


exports.post = function (name, callback, context) {
  var post_id = context.getLocals('query_post_id');
  post_id = post_id && post_id[1];
  asyncFilters.query_posts_content(post_id, callback);
};


exports.comments = function (name, callback, context) {
  var post_id = context.getLocals('query_post_id');
  post_id = post_id && post_id[1];
  var comment_id = context.getLocals('query_comment_id');
  comment_id = comment_id && comment_id[1];
  asyncFilters.query_posts_comments(post_id, comment_id, callback);
};
