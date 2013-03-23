exports.path = '/posts/:id/:comment_id/reply';

exports.get = function (req, res, next) {
  var c = res.locals.context;
  var id = req.params.id;
  c.setLocals('query_post_id', id);
  var comment_id = req.params.comment_id;
  c.setLocals('query_comment_id', comment_id);
  res.render('reply');
};
