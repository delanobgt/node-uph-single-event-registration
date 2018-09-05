function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next()
  return res.redirect('/admin/auth/login')
}

module.exports = {
  isLoggedIn
}