/**
 * Posts Model
 */

module.exports = function (cache, db, config) {
  var exports = module.exports;
  var context = config.http.engine.context;
  
  // Posts list
  // Example:
  // {% paginate posts by 30 %}
  //   {% for post in posts %}{{post.title}}{% endfor %}
  // {% endpaginate %}
  // Or
  // {% assign posts = 30 | query_posts_list, query_page %}
  context.setAsyncFilter('query_posts_list', function (size, page, callback) {
    // Get posts list
    db.getList('posts', page, size, {}, {timestamp: 'desc'}, function (err, list) {
      if (err) return callback(err);

      // Get contents
      var ids = list.map(function (item) {
        return parseInt(item.id);
      });
      cache.getList('contents:', ids, function (id, callback) {
        db.getOne('contents', {post_id: id}, function (err, data) {
          callback(err, data && data.content);
        });
      }, function (err, cList) {
        if (err) return callback(err);
        cList.forEach(function (item, i) {
          list[i].content = item;
        });
        
        // Get users
        var ids = list.map(function (item) {
          return parseInt(item.user_id);
        });
        cache.getList('users:', ids, function (id, callback) {
          db.getOne('users', {id: id}, callback);
        }, function (err, uList) {
          if (err) return callback(err);
          uList.forEach(function (item, i) {
            list[i].user = item.username;
          });

          // Get comment count
          var ids = list.map(function (item) {
            return parseInt(item.id);
          });
          cache.getList('posts:comment:', ids, function (id, callback) {
            db.getCount('comments', {post_id: id}, callback);
          }, function (err, cList) {
            if (err) return callback(err);
            cList.forEach(function (item, i) {
              list[i].comment = item;
            });

            callback(null, list);
          });
        });
      });
    });
  });

  // Get post content
  // Example:
  // {% assign post = query_post_id | query_posts_content %}
  // Or
  // {{post}}
  context.setAsyncFilter('query_posts_content', function (post_id, callback) {
    query_posts_content(post_id, callback);
  });
  context.setAsyncLocals('post', function (name, callback, context) {
    var post_id = context.getLocals('query_post_id');
    post_id = post_id && post_id[1];
    query_posts_content(post_id, callback);
  });
  var query_posts_content = function (post_id, callback) {
    // Get specify post
    post_id = parseInt(post_id);
    cache.get('posts:', post_id, function (post_id, callback) {
      db.getOne('posts', {id: post_id}, callback);
    }, function (err, post) {
      if (err) return callback(err);

      // Get content
      cache.get('contents:', post_id, function (post_id, callback) {
        db.getOne('contents', {post_id: post_id}, function (err, data) {
          callback(err, data && data.content);
        });
      }, function (err, content) {
        if (err) return callback(err);
        post.content = content;

        // Get user
        cache.get('users:', post.user_id, function (user_id, callback) {
          db.getOne('users', {id: user_id}, callback);
        }, function (err, user) {
          if (err) return callback(err);
          post.user = user.username;

          // Get comment count
          cache.get('posts:comment:', post_id, function (post_id, callback) {
            db.getCount('comments', {post_id: post_id}, callback);
          }, function (err, comment) {
            if (err) return callback(err);
            post.comment = comment;

            callback(null, post);
          });
        });
      });
    });
  };


  return exports;
};
