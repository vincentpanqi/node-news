exports.path = '/posts/:id';

exports.get = function (req, res, next) {
  var c = res.locals.context;
  var id = req.params.id;
  c.setLocals('query_post_id', id);
  res.render('content');
};
