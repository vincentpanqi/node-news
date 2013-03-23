/**
 * Utils
 */

var crypto = require('crypto');
var path = require('path');
var fs = require('fs');
var xss = require('xss');
var tinyliquid = require('tinyliquid');
var tomatolog = require('tomatolog');
var validator = require('validator');


exports.check = validator.check;
exports.sanitize = validator.sanitize;

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

/**
 * Remove dangerous HTML tag
 *
 * @param {String} html
 * @return {String}
 */
exports.xss = function (html) {
  return xss(html);
};

/**
 * Create new tinyliquid context object
 *
 * @param {Object} options
 * @return {Object}
 */
exports.newContext = tinyliquid.newContext;

/**
 * Parse liquid template
 *
 * @param {String} tpl
 * @return {Array}
 */
exports.parseTemplate = tinyliquid.parse;

/**
 * Create logger
 *
 * @param {String} name
 * @param {Object} config
 * @return {Object}
 */
exports.createLogger = tomatolog.createLogger;

/**
 * Load config
 *
 * @return {Object}
 */
exports.loadConfig = function () {
  var config = require('../config');

  config.env = config.env || 'development';
  config.env = config.env.toLowerCase();

  config.log = config.log || {enable: false};
  config.log.path = config.log.path || './log';
  config.log.interval = config.log.interval || 2000;
  config.log.level = config.log.level || 'debug';
  config.log.output = typeof(config.log.output) === 'undefined' ? true : config.log.output;

  config.http = config.http || {};
  config.http.port = config.http.port || 8080;
  config.http.views = path.resolve(config.http.views || './views');
  config.http['view suffix'] = config.http['view suffix'] || 'liquid';
  if (config.http['view suffix'][0] === '.') config.http['view suffix'] = config.http['view suffix'].substr(1);
  config.http['static path'] = path.resolve(config.http['static path'] || './public');
  config.http['static maxage'] = config.http['static maxage'] || 31536000000;
  config.http.favicon = config.http.favicon || undefined;
  config.http['session store'] = config.http['session store'] || 'file';
  config.http['session config'] = config.http['session config'] || {};
  config.http.secret = config.http.secret || 'default secret string';
  config.http.compress = config.http.compress || false;
  config.http.timeout = config.http.timeout > 0 ? config.http.timeout : false;

  return config;
};

/**
 * Auto register routes
 *
 * @param {Object} app
 * @param {String} dir
 */
var autoRouting = exports.autoRouting = function (app, dir) {
  fs.readdirSync(dir).forEach(function (n) {
    var f = path.resolve(dir, n);
    var s = fs.statSync(f);
    if (s.isFile()) {
      var m = require(f);
      if (m.path) {
        if (typeof(m.get) === 'function') app.get(m.path, m.get);
        if (typeof(m.post) === 'function') app.post(m.path, m.post);
        if (typeof(m.del) === 'function') app.del(m.path, m.del);
        if (typeof(m.head) === 'function') app.head(m.path, m.head);
        if (typeof(m.put) === 'function') app.put(m.path, m.put);
        if (typeof(m.all) === 'function') app.all(m.path, m.all);
      }
    } else if (s.isDirectory()) {
      autoRouting(app, f);
    }
  });
};
