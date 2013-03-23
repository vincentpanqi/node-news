/**
 * Comments model
 */

var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = require('../utils');


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
 * Get comments list
 *
 * @param {Integer} post_id
 * @param {Integer} page
 * @param {Integer} size
 * @param {Function} callback
 */
exports.getListByPostId = function (post_id, page, size, callback) {
  db.getList('comments', page, size, {post_id: post_id}, {timestamp: 'asc'}, function (err, list) {
    callback(err, list || []);
  });
};
