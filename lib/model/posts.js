/**
 * Posts model
 */

var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = global.nodenews.utils;


/**
 * Add post
 *
 * @param {Object} post
 * @param {Function} callback
 */
exports.add = function (post, callback) {
  db.insert('posts', post, function (err, results) {
    if (err) return callback(err);
    post.id = results.insertId;
    callback(null, post);
  });
};

/**
 * Get post
 *
 * @param {String} url
 * @param {Function} callback
 */
exports.getByUrl = function (url, callback) {
  db.getOne('posts', {
    where:  {url: url}
  }, function (err, post) {
    callback(err, post || null);
  });
};

/**
 * Get post
 *
 * @param {Integer} id
 * @param {Function} callback
 */
exports.getById = function (id, callback) {
  db.getOne('posts', {
    where:  {id: id}
  }, function (err, post) {
    callback(err, post || null);
  });
};

/**
 * Update post
 *
 * @param {String} url
 * @param {Object} post
 * @param {Function} callback
 */
exports.updateByUrl = function (url, post, callback) {
  db.update('posts', {url: url}, post, function (err, results) {
    callback(err, results && results.affectedRows);
  });
};

/**
 * Get posts list
 *
 * @param {Integer} page
 * @param {Integer} size
 * @param {Function} callback
 */
exports.getList = function (page, size, callback) {
  db.getList('posts', {
    page:   page,
    size:   size,
    order:  {timestamp: 'desc'}
  }, function (err, list) {
    callback(err, list || []);
  });
};

/**
 * Get posts ID list
 *
 * @param {Integer} page
 * @param {Integer} size
 * @param {Function} callback
 */
exports.getIdList = function (page, size, callback) {
  db.getList('posts', {
    page:   page,
    size:   size,
    order:  {timestamp: 'desc'},
    fields: ['id']
  }, function (err, list) {
    if (err) return callback(err);
    list = list || [];
    list = list.map(function (item) {
      return item.id;
    });
    callback(null, list);
  });
};

/**
 * Get posts leaders list
 *
 * @param {Integer} page
 * @param {Integer} size
 * @param {Function} callback
 */
exports.getLeadersList = function (page, size, callback) {
  db.getList('posts', {
    page:   page,
    size:   size,
    fields: ['user_id', 'COUNT(`id`) AS `count`'],
    group:  ['user_id'],
    order:  {count: 'desc'}
  }, function (err, list) {
    callback(err || null, list || []);
  });
};
