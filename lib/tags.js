/**
 * Custom template tags
 */

var tinyliquid = require('tinyliquid');

exports['paginate'] = function (context, name, body) {
  // Example:     body='posts by 30';
  // Convert to:  {% assign posts = 30 | query_posts_list, query_page %}
  var bs = body.split(/\s+/);
  var n = bs[0];
  var p = bs[2];
  var tpl = '{% assign ' + n + ' = ' + p + ' | query_' + n + '_list: query_page %}';
  context.astStack.push(tinyliquid.parse(tpl));
};

exports['endpaginate'] = function (context, name, body) {
  // Do nothing.
};

