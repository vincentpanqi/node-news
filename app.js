module.exports = function (worker, app, logger, config) {
  var fs = require('fs');
  var path = require('path');
  var tinyliquid = require('tinyliquid');
  var xss = require('xss');
  var newContext = tinyliquid.newContext;
  var utils = require('./lib/utils');


  // Init cache & db connection
  var cache = require('./lib/cache')(worker, app, logger, config);
  var db = require('./lib/db')(worker, app, logger, config);


  // Load all models
  fs.readdirSync('model').forEach(function (name) {
    var filename = path.resolve('model', name);
    var model = require(filename)(cache, db, config);
  });


  // -------------------- Register middleware ----------------------------------
  var USER_URL = ['/submit', '/reply'];
  var checkUserURL = function (url) {
    return USER_URL.indexOf(url) === -1 ? false : true;
  };
  // Init and login check
  app.use(function (req, res, next) {
    var context = res.locals.context = newContext();
    if (req.session.user) {
      context.setLocals('user', req.session.user);
    } else if (checkUserURL(req.url)) {
      return res.redirect('/login');
    }
    next();
  });

  // Render error page
  var sendError = function (err, req, res, next) {
    var lines = err instanceof Error ? err.stack.split(/\r?\n/) : [err];
    var c = res.locals.context || newContext();
    c.setLocals('error', lines[0]);
    c.setLocals('stack', lines.slice(1).join('\n'));
    res.render('error');
  };


  //--------------------- Register router --------------------------------------
  // Home
  app.get('/', function (req, res, next) {
    res.redirect('/posts');
  });

  // News
  app.get('/posts', function (req, res, next) {
    var c = res.locals.context;
    var p = req.query.p;
    if (!(p > 0)) p = 1;
    c.setLocals('query_page', p);
    res.render('index');
  });

  // Content
  app.get('/posts/:id', function (req, res, next) {
    var c = res.locals.context;
    var id = req.params.id;
    c.setLocals('query_post_id', id);
    res.render('content');
  });
  app.get('/posts/:id/:comment_id', function (req, res, next) {
    var c = res.locals.context;
    var id = req.params.id;
    c.setLocals('query_post_id', id);
    var comment_id = req.params.comment_id;
    c.setLocals('query_comment_id', comment_id);
    res.render('content');
  });
  app.get('/posts/:id/:comment_id/reply', function (req, res, next) {
    var c = res.locals.context;
    var id = req.params.id;
    c.setLocals('query_post_id', id);
    var comment_id = req.params.comment_id;
    c.setLocals('query_comment_id', comment_id);
    res.render('reply');
  });

  // Submit & Reply
  app.get('/submit', function (req, res, next) {
    res.render('submit');
  });
  app.post('/submit', function (req, res, next) {
    var title = xss(String(req.body.title || '')).trim();
    var url = xss(String(req.body.url || '')).trim();
    var text = xss(String(req.body.text || '')).trim();
    if (!title) return sendError('Title cannot be empty!', req, res, next);
    var data = {
      title:      title,
      url:        url,
      user_id:    req.session.user.id,
      timestamp:  Date.now() / 1000
    };
    var updateCacheAndReturn = function () {
      cache.set('posts:' + data.id, config.redis.ttl, data);
      res.redirect('/');
    };
    var insertContent = function () {
      if (text) {
        db.delete('contents', {post_id: data.id}, function (err, content) {
          db.insert('contents', {
            post_id:    data.id,
            content:    text,
            timestamp:  data.timestamp
          }, function (err, results) {
            if (err) return sendError(err, req, res, next);
            if (results.affectedRows < 1) return sendError('Submit fail!', req, res, next);
            updateCacheAndReturn();
          });
        });
      } else {
        updateCacheAndReturn();
      }
    };
    if (url) {
      db.getOne('posts', {url: url}, function (err, post) {
        // If the url is already exists, then update it
        if (post) {
          db.update('posts', {url: url}, data, function (err, results) {
            if (err) return sendError(err, req, res, next);
            if (results.affectedRows < 1) return sendError('Submit fail!', req, res, next);
            data.id = post.id;
            insertContent();
          });
        } else {
          db.insert('posts', data, function (err, results) {
            if (err) return sendError(err, req, res, next);
            if (results.affectedRows < 1) return sendError('Submit fail!', req, res, next);
            data.id = results.insertId;
            insertContent();
          });
        }
      });
    } else {
      db.insert('posts', data, function (err, results) {
        if (err) return sendError(err, req, res, next);
        if (results.affectedRows < 1) return sendError('Submit fail!', req, res, next);
        data.id = results.insertId;
        insertContent();
      });
    }
  });
  app.post('/reply', function (req, res, next) {
    var post_id = parseInt(req.body.post_id || 0);
    var comment_id = parseInt(req.body.comment_id || 0);
    var text = xss(String(req.body.text || '').trim());
    if (!(post_id > 0)) return sendError('Incorrect post id.', req, res, next);
    if (!text) return sendError('Comment cannot be empty!', req, res, next);
    if (!(comment_id > 0)) comment_id = 0;
    var user_id = req.session.user.id;
    db.insert('comments', {
      post_id:    post_id,
      parent_id:  comment_id,
      user_id:    user_id,
      content:    text,
      timestamp:  Date.now() / 1000  
    }, function (err, results) {
      if (err) return sendError(err, req, res, next);
      if (results.affectedRows < 1) return sendError('Add comment fail!', req, res, next);
      // update cache
      cache.incr('posts:comment:' + post_id);
      // return to the origin url
      res.redirect(req.header('referer') || '/');
    });
  });

  // Login & Register & Logout
  app.get('/login', function (req, res, next) {
    res.render('login');
  });
  app.post('/login', function (req, res, next) {
    var username = String(req.body.username);
    var password = String(req.body.password);
    db.getOne('users', {username: username}, function (err, user) {
      if (err || !user) return sendError('User not exists!', req, res, next);
      if (utils.validatePassword(password, user.password)) {
        req.session.user = user;
        res.redirect('/');
      } else {
        sendError('Incorrect password!', req, res, next);
      }
    });
  });
  app.all('/logout', function (req, res, next) {
    req.session.user = null;
    res.redirect('/');
  });
  app.post('/register', function (req, res, next) {
    var username = xss(req.body.username || '').trim();
    var password = req.body.password || '';
    var email = xss(req.body.email || '').trim();
    if (username && password) {
      password = utils.encryptPassword(password);
      db.getOne('users', {username: username}, function (err, user) {
        if (user) return sendError('This username is already exists!', req, res, next);
        user = {
          username: username,
          password: password,
          email:    email,
          timestamp: Date.now() / 1000
        };
        db.insert('users', user, function (err, results) {
          if (err) return sendError(err, req, res, next);
          if (results.affectedRows < 1) return sendError('Create account fail!', req, res, next);
          // auto login
          user.id = results.insertId;
          req.session.user = user;
          res.redirect('/');
        });
      });
    } else {
      sendError('Username and password cannot be empty!', req, res, next);
    }
  });

  // Comments
  app.get('/comments', function (req, res, next) {
    sendError('还没有做呢！', req, res, next);
  });

  // Leaders
  app.get('/leaders', function (req, res, next) {
    sendError('还没有做呢！', req, res, next);
  });

  // User
  app.get('/user/:username', function (req, res, next) {
    sendError('还没有做呢！', req, res, next);
  });

};