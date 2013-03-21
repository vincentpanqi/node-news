/**
 * Custom filters
 */

var moment = require('moment');
var xss = require('xss');


/**
 * Generate friendly time string
 *
 * @param {Integer} timestamp   timestamp in seconds
 * @return {String}
 */
exports.format_time = function (timestamp) {
  return moment(timestamp * 1000).fromNow();
};

/**
 * Remove dangerous HTML tag
 *
 * @param {String}
 * @return {String}
 */
exports.xss = function (text) {
  return xss(text);
};
