module.exports = function (worker, app, logger, config) {
  var fs = require('fs');
  var path = require('path');
  var tinyliquid = require('tinyliquid');
  var newContext = tinyliquid.newContext;


  // Init cache & db connection
  var cache = require('./lib/cache')(worker, app, logger, config);
  var db = require('./lib/db')(worker, app, logger, config);


  // Load all models
  fs.readdirSync('model').forEach(function (name) {
    var filename = path.resolve('model', name);
    var model = require(filename)(cache, db, config);
  });


  //--------------------- Register router --------------------------------------
  // Home
  app.get('/', function (req, res, next) {
    res.redirect('/posts');
  });

  // News
  app.get('/posts', function (req, res, next) {
    var c = newContext();
    var p = req.query.p;
    if (!(p > 0)) p = 1;
    c.setLocals('query_page', p);
    res.render('index', {context: c});
  });

  // Content
  app.get('/posts/:id', function (req, res, next) {
    var c = newContext();
    var id = req.params.id;
    c.setLocals('query_post_id', id);
    res.render('content', {context: c});
  });
  app.get('/posts/:id/:comment_id', function (req, res, next) {
    var c = newContext();
    var id = req.params.id;
    c.setLocals('query_post_id', id);
    var comment_id = req.params.comment_id;
    c.setLocals('query_comment_id', comment_id);
    res.render('content', {context: c});
  });
  
};