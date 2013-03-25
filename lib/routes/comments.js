exports.path = '/comments';

exports.get = function (req, res, next) {
  var c = res.locals.context;
  var p = req.query.p;
  if (!(p > 0)) p = 1;
  c.setLocals('query_page', p);
  res.render('comments');
};
