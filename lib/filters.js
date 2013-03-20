/**
 * Custom filters
 */

var moment = require('moment');


/**
 * Generate friendly time string
 *
 * @param {Integer} timestamp   timestamp in seconds
 * @return {String}
 */
exports.format_time = function (timestamp) {
  return moment(timestamp * 1000).fromNow();
};
