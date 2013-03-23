/**
 * Users model
 */

var db = global.nodenews.db;
var cache = global.nodenews.cache;
var config = global.nodenews.config;
var utils = require('../utils');


/**
 * Get user
 *
 * @param {String} username
 * @param {Function} callback
 */
exports.getByUsername = function (username, callback) {
  db.getOne('users', {username: username}, function (err, user) {
    callback(err, user || null);
  });
};

/**
 * Add user
 *
 * @param {Object} user
 * @param {Function} callback
 */
exports.add = function (user, callback) {
  db.insert('users', user, function (err, results) {
    if (err) return callback(err);
    user.id = results && results.insertId;
    callback(null, user);
  });
};
