module.exports = function (worker, app, logger, config) {
  var fs = require('fs');
  var path = require('path');
  var tinyliquid = require('tinyliquid');
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
  app.use(function (req, res, next) {
    var context = res.locals.context = newContext();
    if (req.session.user) context.setLocals('user', req.session.user);
    next();
  });

  // Render error page
  var renderErrorPage = function (err, req, res, next) {
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

  // Reply
  app.post('/reply', function (req, res, next) {
    var post_id = req.params.post_id;
    var comment_id = req.params.comment_id;
    next();
  });

  // Login & Register & Logout
  app.get('/login', function (req, res, next) {
    res.render('login');
  });
  app.post('/login', function (req, res, next) {
    var username = String(req.body.username);
    var password = String(req.body.password);
    db.getOne('users', {username: username}, function (err, user) {
      if (err || !user) return renderErrorPage('User not exists!', req, res, next);
      if (utils.validatePassword(password, user.password)) {
        req.session.user = user;
        res.redirect('/');
      } else {
        renderErrorPage('Incorrect password!', req, res, next);
      }
    });
  });
  app.all('/logout', function (req, res, next) {
    req.session.user = null;
    res.redirect('/');
  });
  
};