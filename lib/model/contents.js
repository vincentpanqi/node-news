/**
 * Contents model
 */

var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = global.nodenews.utils;


/**
 * Add content
 *
 * @param {Object} content
 * @param {Function} callback
 */
exports.add = function (content, callback) {
  db.insert('contents', content, function (err, results) {
    if (err) return callback(err);
    content.id = results && results.insertId;
    callback(null, content);
  });
};

/**
 * Delete content
 *
 * @param {Integer} post_id
 * @param {Function} callback
 */
exports.deleteByPostId = function (post_id, callback) {
  db.delete('contents', {post_id: post_id}, function (err, results) {
    callback(err, results && results.affectedRows);
  });
};

/**
 * Get content
 *
 * @param {Integer} post_id
 * @param {Function} callback
 */
exports.getByPostId = function (post_id, callback) {
  db.getOne('contents', {post_id: post_id}, function (err, content) {
    callback(err, content || null);
  });
};
