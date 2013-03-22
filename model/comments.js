/**
 * Comments Model
 */

module.exports = function (cache, db, config) {
  var exports = module.exports;
  var context = config.http.engine.context;
  var flow = require('bright-flow');
  

  // Get post comments
  // Example:
  // {% assign comments = query_post_id | query_posts_comments: comment_id %}
  // Or
  // {{comments}}
  context.setAsyncFilter('query_posts_comments', function (post_id, comment_id, callback) {
    query_posts_comments(post_id, comment_id, callback);
  });
  context.setAsyncLocals('comments', function (name, callback, context) {
    var post_id = context.getLocals('query_post_id');
    post_id = post_id && post_id[1];
    var comment_id = context.getLocals('query_comment_id');
    comment_id = comment_id && comment_id[1];
    query_posts_comments(post_id, comment_id, callback);
  });
  var query_posts_comments = function (post_id, comment_id, callback) {
    post_id = parseInt(post_id);
    comment_id = parseInt(comment_id);
    if (!(comment_id > 0)) comment_id = 0;

    // Get all comments
    db.getList('comments', 1, 1000, {post_id: post_id}, {timestamp: 'asc'}, function (err, list) {
      if (err) return callback(err);

      // Make tree structure
      var tree = {};
      list.forEach(function (item) {
        if (tree[item.id]) {
          for (var i in item) tree[item.id][i] = item[i];
        } else {
          item.childs = [];
          tree[item.id] = item;
        }
        if (tree[item.parent_id]) {
          tree[item.parent_id].childs.push(item);        
        }
      });

      // Filter
      if (comment_id > 0) {
        if (tree[comment_id]) {
          list = [tree[comment_id]];
        } else {
          list = [];
        }
      } else {
        list = [];
        for (var i in tree) {
          if (tree[i].parent_id < 1) list.push(tree[i]);
        }
      }
      if (!Array.isArray(list)) return callback(null, []);

      // Get users
      var users = {};
      var findUserId = function (list) {
        list.forEach(function (item) {
          if (!users[item.user_id]) users[item.user_id] = [];
          users[item.user_id].push(item);
          if (item.childs && item.childs.length > 0) findUserId(item.childs);
        });
      };
      findUserId(list);
      var uids = Object.keys(users);
      cache.getList('users:', uids, function (id, callback) {
        db.getOne('users', {id: id}, callback);
      }, function (err, uList) {
        if (err) return callback(err);
        uList.forEach(function (user) {
          if (users[user.id]) {
            users[user.id].forEach(function (item) {
              item.user = user.username;
            });
          }
        });

        callback(null, list);
      });
    });
  };


  return exports;
};