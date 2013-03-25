/**
 * Custom async filters
 */

var flow = require('bright-flow');
var cache = global.nodenews.cache;
var model = global.nodenews.model;
var define = global.nodenews.define;


/**
 * Query posts list
 *
 * @param {Integer} size
 * @param {Integer} page
 * @param {Function} callback
 */
exports.query_posts_list = function (size, page, callback) {
  // Get posts list
  cache.get(define.cache.posts_list, size + '_' + page, function (key, callback) {
    model.posts.getIdList(page, size, callback);
  }, function (err, ids) {
    if (err) return callback(err); 
    cache.getList(define.cache.posts, ids, model.posts.getById, function (err, list) {
      if (err) return callback(err);

      var uids = list.map(function (item) {
        return parseInt(item.user_id);
      });

      flow.parallel()
        // Get contents
        .do(function (done) {
          cache.getList(define.cache.contents, ids, function (id, callback) {
            model.contents.getByPostId(id, function (err, data) {
              callback(err, data && data.content);
            });
          }, function (err, cList) {
            if (err) return callback(err);
            cList.forEach(function (item, i) {
              list[i].content = item;
            });
            done();
          });
        })
        // Get users
        .do(function (done) {
          cache.getList(define.cache.users, uids, model.users.getById, function (err, uList) {
            if (err) return callback(err);
            uList.forEach(function (item, i) {
              list[i].user = item.username;
            });
            done();
          });
        })
        // Get comment count
        .do(function (done) {
          cache.getList(define.cache.posts_comment, ids, model.comments.getCountByPostId, function (err, cList) {
            if (err) return callback(err);
            cList.forEach(function (item, i) {
              list[i].comment = item;
            });
            done();
          });
        })
        // End
        .end(function () {
          callback(null, list);
        });
    });
  });
};

/**
 * Query posts content
 *
 * @param {Integer} post_id
 */
exports.query_posts_content = function (post_id, callback) {
  // Get specify post
  post_id = parseInt(post_id);
  cache.get(define.cache.posts, post_id, model.posts.getById, function (err, post) {
    if (err) return callback(err);

    flow.parallel()
      // Get content
      .do(function (done) {
        cache.get(define.cache.contents, post_id, function (post_id, callback) {
          model.contents.getByPostId(post_id, function (err, data) {
            callback(err, data && data.content);
          });
        }, function (err, content) {
          if (err) return callback(err);
          post.content = content;
          done();
        });
      })
      // Get user
      .do(function (done) {
        cache.get(define.cache.users, post.user_id, model.users.getById, function (err, user) {
          if (err) return callback(err);
          post.user = user.username;
          done();
         });
       })
      // Get comment count
      .do(function (done) {
        cache.get(define.cache.posts_comment, post_id, model.comments.getCountByPostId, function (err, comment) {
          if (err) return callback(err);
          post.comment = comment;
          done();
        });
      })
      // End
      .end(function () {
        callback(null, post);
      });
  });
};

/**
 * Query posts comments list
 *
 * @param {Integer} size
 * @param {Integer} page
 * @param {Function} callback
 */
exports.query_comments_list = function (size, page, callback) {
  page = parseInt(page);
  if (!(page > 0)) page = 1;
  size = parseInt(size);
  if (!(size > 0)) size = 30;

  // Get all comments
  cache.get(define.cache.comments_list,  page + '_' + size, function (key, callback) {
    model.comments.getIdList(page, size, callback);
  }, function (err, ids) {
    if (err) return callback(err);
    cache.getList(define.cache.comments, ids, model.comments.getById, function (err, list) {
      if (err) return callback(err);

      flow.parallel()
        // Get users
        .do(function (done) {
          var uids = list.map(function (item) {
            return parseInt(item.user_id);
          });    
          cache.getList(define.cache.users, uids, model.users.getById, function (err, uList) {
            if (err) return callback(err);
            uList.forEach(function (user, i) {
              list[i].user = user.username;
            });
            done();
          });
        })
        // Get posts
        .do(function (done) {
          var pids = list.map(function (item) {
            return parseInt(item.post_id);
          });
          cache.getList(define.cache.posts, pids, model.posts.getById, function (err, pList) {
            if (err) return callback(err);
            pList.forEach(function (post, i) {
              list[i].post = post;
            });
            done();
          });
        })
        // End
        .end(function () {
          callback(null, list);
        });
    });
  });
};

/**
 * Query leaders list
 *
 * @param {Integer} size
 * @param {Integer} page
 * @param {Function} callback
 */
exports.query_leaders_list = function (size, page, callback) {
  size = parseInt(size);
  if (!(size > 0)) size = 20;
  page = parseInt(page);
  if (!(page > 0)) page = 1;

  
};

/**
 * Query posts comments
 *
 * @param {Integer} post_id
 * @param {Integer} comment_id
 * @param {Integer} page
 * @param {Integer} count
 * @param {Function} callback
 */
exports.query_comments_tree = function (post_id, comment_id, page, count, callback) {
  post_id = parseInt(post_id);
  comment_id = parseInt(comment_id);
  if (!(comment_id > 0)) comment_id = 0;
  page = parseInt(page);
  if (!(page > 0)) page = 1;
  count = parseInt(count);
  if (!(count > 0)) count = 1000;

  // Get all comments
  cache.get(define.cache.comments_list, post_id + ':' + page + '_' + count, function (key, callback) {
    model.comments.getIdListByPostId(post_id, page, count, callback);
  }, function (err, ids) {
    if (err) return callback(err);
    cache.getList(define.cache.comments, ids, model.comments.getById, function (err, list) {
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
      cache.getList(define.cache.users, uids, model.users.getById, function (err, uList) {
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
  });
};
