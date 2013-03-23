/**
 * Custom template tags
 */

var utils = global.nodenews.utils;


// Example:
// {% paginate posts by 30 %}
//   {% for post in posts %}{{post.title}}{% endfor %}
// {% endpaginate %}
exports.paginate = function (context, name, body) {
  // Example:     body='posts by 30';
  // Convert to:  {% assign posts = 30 | query_posts_list, query_page %}
  var bs = body.split(/\s+/);
  var n = bs[0];
  var p = bs[2];
  var tpl = '{% assign ' + n + ' = ' + p + ' | query_' + n + '_list: query_page %}';
  context.astStack.push(utils.parseTemplate(tpl));
};
exports.endpaginate = function (context, name, body) {
  // Do nothing.
};

// Example:
// {% tree comments %}
// {% for comment in comments %}{{comment.content}}{% endfor %}
exports.tree = function (content, name, body) {
  // Example:     comments
  // Convert to:  {% assign comments = query_post_id | query_comments_tree: query_comment_id, 1, 1000 %}
  var bs = body.split(/\s+/);
  var n = bs[0];
  var tpl = '{% assign ' + n + ' = query_post_id | query_' + n + '_tree: query_comment_id, 1, 1000 %}';
  content.astStack.push(utils.parseTemplate(tpl));
};
