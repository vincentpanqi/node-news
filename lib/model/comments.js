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
