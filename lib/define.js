/**
 * Define
 */


// Cache key prefix
exports.cache = {
  users:          'u:',
  posts:          'p:',
  posts_comment:  'p:r:',
  contents:       'c:',
  comments:       'r:',
  posts_list:     'pl:',
  comments_list:  'rl:',
  leaders_list:   'lel:'
};

// Check
exports.check = {
  username:       /^[a-zA-Z0-9]{4,20}$/,
  passwordLength: 6
}