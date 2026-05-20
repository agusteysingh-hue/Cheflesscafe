function requireAuth(req, res, next) {
  if (req.session && req.session.userId != null) {
    return next();
  }
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/login');
}

function addUserToLocals(req, res, next) {
  res.locals.user = req.session && req.session.userId != null ? {
    id: req.session.userId,
    name: req.session.userName,
    email: req.session.userEmail,
    isAdmin: req.session.isAdmin || false,
  } : null;
  next();
}

module.exports = { requireAuth, requireAdmin, addUserToLocals };
