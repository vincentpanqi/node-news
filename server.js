/**
 * Start server
 */

var express = require('express');
var RedisStore = require('connect-redis')(express);
var expressLiquid = require('express-liquid');
var debug = require('debug')('nodenews:');
var define = require('./lib/define');
var utils = require('./lib/utils');


// Global namespace
var nodenews = global.nodenews = {
  define: define,
  utils:  utils
};

// Config
var config = nodenews.config = utils.loadConfig();

// Logger
var logger = nodenews.logger = utils.createLogger('nodenews', config.log);

// Database & cache connection
nodenews.db = require('./lib/data/db');
nodenews.cache = require('./lib/data/cache');

// Model
var model = nodenews.model = {};
model.users = require('./lib/model/users');
model.comments = require('./lib/model/comments');
model.contents = require('./lib/model/contents');
model.posts = require('./lib/model/posts');

// TinyLiquid engine config
nodenews.engine = {
  context:      utils.newContext({
    locals: {
      config:   exports,
      title:    'Node News'
    } 
  }),
  customTags:   require('./lib/template/tags')
};
var context = nodenews.engine.context;
var asyncLocals = require('./lib/template/asynclocals');
for (var i in asyncLocals) context.setAsyncLocals(i, asyncLocals[i]);
var filters = require('./lib/template/filters');
for (var i in filters) context.setFilter(i, filters[i]);
var asyncFilters = require('./lib/template/asyncfilters');
for (var i in asyncFilters) context.setAsyncFilter(i, asyncFilters[i]);


// HTTP service
var app = nodenews.app = express();
app.configure(function () {
  app.set('env', config.env);

  app.set('views', config.http.views);
  app.set('view engine', config.http['view suffix']);
  app.engine(config.http['view suffix'], expressLiquid(nodenews.engine));

  app.use(require('./lib/middleware/httplog')());

  app.use(express.favicon(config.http.favicon));
  if (config.http.timeout > 0) app.use(express.timeout(config.http.timeout));
  app.use(express.urlencoded());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.http.secret));
  if (config.http.compress) app.use(express.compress());
  switch (config.http['session store']) {
    case 'redis':
      app.use(express.session({
        secret: config.http.secret,
        store:  new RedisStore(config.http['session config'])
      }));
      break;
    case 'cookie':
      app.use(express.cookieSession({
        secret: config.http.secret,
        cookie: config.http['session config']
      }));
      break;
    default:
      app.use(express.session({
        secret: config.http.secret,
        cookie: {
          secure: true
        }
      }));
  }

  app.use(require('./lib/middleware/auth')());

  app.use(app.router);
  app.use('/public', express.static(config.http['static path'], {maxAge: config.http['static maxage']}));

  // Register routes
  app.get('/', function (req, res, next) {
    res.redirect('/posts');
  });
  utils.autoRouting(app, './lib/routes');
});
app.listen(config.http.port);

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  logger.fatal({stack: err.stack});
});

logger.info('Server start.');
