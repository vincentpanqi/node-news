/**
 * Cache
 */

var redis = require('redis');
var logger = global.nodenews.logger;
var config = global.nodenews.config;

// Connect to redis server
var db = redis.createClient(config.redis.port, config.redis.host);
db.select(config.redis.db);

db.on('error', function (err) {
  logger.error({source: 'redis', error: err && err.stack});
});


/**
 * Get multi cache
 *
 * @param {String} prefix
 * @param {Array} keys
 * @param {Function} getData    If couldn't find that key, then will call this function to get it, and save to cache
 * @param {Function} callback
 */
exports.getList = function (prefix, keys, getData, callback) {
  if (keys.length < 1) return callback(null, []);

  var fullKeys = keys.map(function (item) {
    return config.redis.prefix + prefix + item;
  });
  db.mget(fullKeys, function (err, list) {
    if (err) return callback(err);

    var needs = [];
    list.forEach(function (item, i) {
      if (!item) {
        needs.push([i, fullKeys[i], keys[i]]);
      } else {
        try {
          list[i] = JSON.parse(item);
        } catch (err) {
          needs.push([i, fullKeys[i], keys[i]]);
        }
      }
    });
    if (needs.length < 1) return callback(null, list);

    var errs = [];
    var length = needs.length;
    var finish = 0;
    var done = function (err) {
      if (err) errs.push(err);
      finish++;
      if (finish >= length) callback(null, list);
    };
    needs.forEach(function (item) {
      getData(item[2], function (err, data) {
        if (err) return done(err);
        list[item[0]] = data;
        done();

        // If data is not null, then save it
        if (data !== null) exports.set(prefix + item[2], config.redis.ttl, data);
      });
    });
  });
};

/**
 * Get single cache
 *
 * @param {String} prefix
 * @param {String} key
 * @param {Function} getData    If couldn't find that key, then will call this function to get it, and save to cache
 * @param {Function} callback
 */
exports.get = function (prefix, key, getData, callback) {
  var fullKey = config.redis.prefix + prefix + key;

  db.get(fullKey, function (err, data) {
    if (err) return callback(err);

    if (data) {
      try {
        data = JSON.parse(data);
      } catch (err) {
        return callback(err);
      }
      return callback(null, data);
    }

    getData(key, function (err, data) {
      if (err) return callback(err);
      callback(err, data);

      // If data is not null, then save it
      if (data !== null) exports.set(prefix + key, config.redis.ttl, data);
    });
  });
};

/**
 * Set single cache
 *
 * @param {String} key
 * @param {Integer} ttl
 * @param {Object} data
 * @param {Function} callback
 */
exports.set = function (key, ttl, data, callback) {
  try {
    data = JSON.stringify(data);
  } catch (err) {
    logger.error('cache', {stack: err.stack});
    callback && callback(err);
  }
  db.setex(config.redis.prefix + key, ttl, data, function (err) {
    if (err) logger.error('cache', {stack: err.stack});
    callback && callback(err || null);
  });
};

/**
 * Set multi cache
 *
 * @param {Array} data    example: {'key1': data1, 'key2': data2}
 * @param {Integer} ttl
 * @param {Function} callback
 */
exports.setList = function (data, ttl, callback) {
  var finish = 0;
  var length = 0;
  var lastErr = null;
  var done = function (err) {
    if (err) lastErr = err;
    finish++;
    if (finish >= length) callback && callback(lastErr);
  };
  for (var key in data) {
    length++;
    exports.set(key, ttl, data[key], done);
  }
};

/**
 * Incr
 *
 * @param {String} key
 * @param {Function} callback
 */
exports.incr = function (key, callback) {
  db.incr(config.redis.prefix + key, function (err, val) {
    callback && callback(err, val);
  });
};

/**
 * Clear cache
 *
 * @param {String} query
 * @param {Function} callback
 */
exports.clear = function (query, callback) {
  db.keys(config.redis.prefix + query, function (err, keys) {
    if (err) return callback && callback(err);
    db.del(keys, function (err) {
      callback && callback(err || null);
    });
  });
};
