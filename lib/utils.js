/**
 * Utils
 */

var crypto = require('crypto');

 
/**
 * Generate MD5 string
 *
 * @param {string} text
 * @return {string}
 */
var md5 = exports.md5 = function (text) {
  return crypto.createHash('md5').update(text).digest('hex');
};
 
/**
 * Encrypt password
 *
 * @param {string} password
 * @return {string}
 */
var encryptPassword = exports.encryptPassword = function (password) {
  var random = md5(Math.random() + '' + Math.random()).toUpperCase();
  var left = random.substr(0, 2);
  var right = random.substr(-2);
  var newpassword = md5(left + password + right).toUpperCase();
  return [left, newpassword, right].join(':');
};
 
/**
 * Validate password
 *
 * @param {string} password
 * @param {string} encrypted
 * @return {bool}
 */
var validatePassword = exports.validatePassword = function (password, encrypted) {
  var random = encrypted.toUpperCase().split(':');
  if (random.length < 3) return false;
  var left = random[0];
  var right = random[2];
  var main = random[1];
  var newpassword = md5(left + password + right).toUpperCase();
  return newpassword === main;
};