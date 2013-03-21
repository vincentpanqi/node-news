var tinyliquid = require('tinyliquid');

exports.env = 'production';

exports.worker = {
  size:   1
};

exports.http = {
  port:   8080,

  engine: {
    context:    tinyliquid.newContext({
      filters:  require('./lib/filters')
    }),
    customTags: require('./lib/tags')
  }
};

exports.log = {
  path:       './log',
  interval:   2000,
  level:      'debug',
  output:     true
};


// Redis server
exports.redis = {
  host:     '127.0.0.1',
  port:     6379,
  db:       5,
  prefix:   'nodenews:',
  ttl:      60,
  pool:     5
};

// MySQL server
exports.sql = {
  host:     '127.0.0.1',
  post:     3302,
  user:     'root',
  password: '',
  database: 'nodenews',
  prefix:   '',
  pool:     2
};

// Site
exports.site = {

};
