/**
 * Comments model
 */

var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = global.nodenews.utils;


/**
 * Add comment
 *
 * @param {Object} comment
 * @param {Function} callback
 */
exports.add = function (comment, callback) {
  db.insert('comments', comment, function (err, results) {
    if (err) return callback(err);
    comment.id = results && results.insertId;
    callback(null, comment);
  });
};

/**
 * Get comments count
 *
 * @param {Integer} post_id
 * @param {Function} callback
 */
exports.getCountByPostId = function (post_id, callback) {
  db.getCount('comments', {post_id: post_id}, callback);
};

/**
 * Get comment
 *
 * @param {Integer} id
 * @param {Function}
 */
exports.getById = function (id, callback) {
  db.getOne('comments', {
    where:  {id: id}
  }, callback);
};

/**
 * Get comments list
 *
 * @param {Integer} post_id
 * @param {Integer} page
 * @param {Integer} size
 * @param {Function} callback
 */
exports.getListByPostId = function (post_id, page, size, callback) {
  db.getList('comments', {
    page:   page,
    size:   size,
    where: {post_id: post_id},
    order: {timestamp: 'asc'}
  }, function (err, list) {
    callback(err, list || []);
  });
};

/**
 * Get comments ID list
 *
 * @param {Integer} post_id
 * @param {Integer} page
 * @param {Integer} size
 * @param {Function} callback
 */
exports.getIdListByPostId = function (post_id, page, size, callback) {
  db.getList('comments', {
    page:   page,
    size:   size,
    where:  {post_id: post_id},
    order:  {timestamp: 'asc'},
    fileds: ['id']
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
 * Get comments ID list
 *
 * @param {Integer} page
 * @param {Integer} size
 * @param {Function} callback
 */
exports.getIdList = function (page, size, callback) {
  db.getList('comments', {
    page:   page,
    size:   size,
    order:  {timestamp: 'asc'},
    fileds: ['id']
  }, function (err, list) {
    if (err) return callback(err);
    list = list || [];
    list = list.map(function (item) {
      return item.id;
    });
    callback(null, list);
  });
};
