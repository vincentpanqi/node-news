/**
 * DB
 */

module.exports = function (worker, app, logger, config) {
  var exports = module.exports;
  var mysql = require('mysql');


  // Connect to MySQL server
  var db = mysql.createConnection({
    host:     config.sql.host,
    port:     config.sql.port,
    user:     config.sql.user,
    password: config.sql.password,
    database: config.sql.database
  });

  db.connect(function (err) {
    if (err) logger.error({source: 'mysql', error: err && err.stack});
  });


  /**
   * Parse query parameters
   *
   * @param {Object} params
   * @return {String}
   */
  var parseCondition = function (params) {
    var cond = [1];
    for (var key in params) {
      cond.push('`' + key + '`=' + db.escape(params[key]));
    }
    return cond.join(' AND ');
  };

  /**
   * Parse "ORDER BY" parameters
   *
   * @param {Object} params
   * @return {String}
   */
  var parseOrderBy = function (params) {
    var order = [];
    for (var key in params) {
      order.push('`' + key + '` ' + params[key].toUpperCase());
    }
    if (order.length > 0) {
      return 'ORDER BY ' + order.join(', ');
    } else {
      return '';
    }
  };

  /**
   * Query and get one row
   *
   * @param {String} table
   * @param {Object} params
   * @param {Function} callback
   */
  exports.getOne = function (table, params, callback) {
    table = config.sql.prefix + table;
    var sql = 'SELECT * FROM `' + table + '` WHERE ' + parseCondition(params) + ' LIMIT 1';
    db.query(sql, function (err, rows) {
      var row = (rows && rows.length > 0) ? rows[0] : null;
      callback(err, row);
    });
  };

  /**
   * Query and get all rows
   *
   * @param {String} table
   * @param {Integer} page
   * @param {Integer} size
   * @param {Object} params
   * @param {Object} orderBy
   * @param {Function} callback
   */
   exports.getList = function (table, page, size, params, orderBy, callback) {
    if (typeof(params) === 'function') {
      callback = params;
      params = {};
    }
    table= config.sql.prefix + table;
    size = parseInt(size);
    var offset = (page - 1) * size;
    var sql = 'SELECT * FROM `' + table + '` WHERE ' + parseCondition(params) + ' ' + parseOrderBy(orderBy) +
              ' LIMIT ' + offset + ',' + size;
    db.query(sql, callback);
  };

  /**
   * Query and get count
   *
   * @param {String} table
   * @param {Object} params
   * @param {Function} callback
   */
  exports.getCount = function (table, params, callback) {
    table = config.sql.prefix + table;
    var sql = 'SELECT COUNT(*) AS `c` FROM `' + table + '` WHERE ' + parseCondition(params) + ' LIMIT 1';
    db.query(sql, function (err, rows) {
      var row = (rows && rows.length > 0) ? rows[0] : null;
      callback(err, row && row.c);
    });
  };
  
  return exports;
};