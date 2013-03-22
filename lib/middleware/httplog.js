/**
 * HTTP request logger middleware
 */

module.exports = function () {
  var utils = require('../utils');
  var logger = utils.createLogger('http');

  /**
   * Get remote IP
   *
   * @param {Object} req
   * @return {String}
   * @api private
   */
  var getRemote = function (req) {
    if (req.headers['x-real-ip']) return req.headers['x-real-ip'];
    return req.socket && (req.socket.remoteAddress || (req.socket.socket && req.socket.socket.remoteAddress));
  };

  return function (req, res, next) {
    req._startTime = new Date();
    if (logger) {
      logger.info({
        event:    'request',
        remote:   getRemote(req),
        method:   req.method,
        host:     req.headers['host'],
        url:      req.url,
        referrer: req.headers['referer'] || req.headers['referrer'],
        version:  req.httpVersionMajor + '.' + req.httpVersionMinor,
        agent:    req.headers['user-agent']
      });
    }
    var end = res.end;
    res.end = function (chunk, encoding) {
      res.end = end;
      res.end(chunk, encoding);
      if (logger) {
        logger.info({
          event:    'response',
          method:   req.method,
          host:     req.headers['host'],
          url:      req.url,
          status:   res.statusCode,
          length:   parseInt(res.getHeader('Content-Length'), 10),
          spent:    new Date - req._startTime
        });
      }
    };
    next();
  };
};
