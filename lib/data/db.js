/**
 * DB
 */

var mysql = require('mysql');
var logger = global.nodenews.logger;
var config = global.nodenews.config;


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
 * Parse "INSERT" parameters
 *
 * @param {String} table
 * @param {Object} data
 * @return {String}
 */
var parseInsert = function (table, data) {
  var fields = [];
  var values = [];
  for (var key in data) {
    fields.push('`' + key + '`');
    values.push(db.escape(data[key]));
   };
  return 'INSERT INTO `' + table + '`(' + fields.join(',') + ') VALUES (' + values.join(',') + ')';
};

/**
 * Parse "UPDATE" parameters
 *
 * @param {String} table
 * @param {String} where
 * @param {Object} data
 * @return {String}
 */
var parseUpdate = function (table, where, data) {
  var update = [];
  for (var key in data) {
    update.push('`' + key + '`=' + db.escape(data[key]));
  };
  return 'UPDATE `' + table + '` SET ' + update.join(',') + ' WHERE ' + where;
};

/**
 * Parse "SELECT" fields
 *
 * @param {Array} fields
 * @return {String}
 */
var parseField = function (fields) {
  if (fields.length > 0) {
    return fields.map(function (item) {
      if (item !== '*') return '`' + item + '`';
    }).join(',');
  } else {
    return '*';
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
 * @param {Object} fields
 * @param {Function} callback
 */
exports.getList = function (table, page, size, params, orderBy, fields, callback) {
  if (typeof(fields) === 'function') {
    callback = fields;
    fields = ['*'];
  }
  table= config.sql.prefix + table;
  size = parseInt(size);
  var offset = (page - 1) * size;
  var sql = 'SELECT ' + parseField(fields) + ' FROM `' + table + '` WHERE ' + parseCondition(params) + ' ' + parseOrderBy(orderBy) +
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

/**
 * Insert records
 *
 * @param {String} table
 * @param {Object} data
 * @param {Function} callback
 */
exports.insert = function (table, data, callback) {
  var sql = parseInsert(table, data);
  db.query(sql, function (err, results) {
    callback(err, results);
  });
};

/**
 * Delete records
 *
 * @param {String} table
 * @param {Object} params
 * @param {Function} callback
 */
exports.delete = function (table, params, callback) {
  var where = parseCondition(params).trim();
  if (where === '1') return callback(new Error('Warning: This operator will delete all records!'));
  var sql = 'DELETE `' + table + '` WHERE ' + where;
  db.query(sql, function (err, results) {
    callback(err, results);
  });
};

/**
 * Update records
 *
 * @param {String} table
 * @param {Object} params
 * @param {Object} data
 * @param {Function} callback
 */
exports.update = function (table, params, data, callback) {
  var where = parseCondition(params).trim();
  if (where === '1') return callback(new Error('Warning: This operator will modify all records!'));
  var sql = parseUpdate(table, where, data);
  db.query(sql, function (err, results) {
    callback(err, results);
  });
};
