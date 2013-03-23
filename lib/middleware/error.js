/**
 * Error handler middleware
 */


module.exports = function () {
  return function (err, req, res, next) {
    var lines = err instanceof Error ? err.stack.split(/\r?\n/) : [err];
    var c = res.locals.context || newContext();
    c.setLocals('error', lines[0]);
    c.setLocals('stack', lines.slice(1).join('\n'));
    res.render('error');
  };
};
