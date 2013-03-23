/**
 * Custom filters
 */

var moment = require('moment');
var utils = global.nodenews.utils;


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
exports.xss = utils.xss;

/**
 * Get asset URL
 *
 * @param {String} filename
 * @return {String}
 */
exports.asset_url = function (filename) {
  return '/public/' + filename;
};
