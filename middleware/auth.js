// Authentication middleware
const authenticateUser = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
};

// Authorization middleware for owners only
const authorizeOwner = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'owner') {
    return next();
  } else {
    req.flash('error', 'Access denied. Owner privileges required.');
    return res.redirect('/');
  }
};

// Authorization middleware for buyers only
const authorizeBuyer = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'buyer') {
    return next();
  } else {
    req.flash('error', 'Access denied. Buyer privileges required.');
    return res.redirect('/');
  }
};

// Middleware to check if user is logged in (for optional authentication)
const checkAuth = (req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
};

// Middleware to prevent logged in users from accessing auth pages
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  next();
};

module.exports = {
  authenticateUser,
  authorizeOwner,
  authorizeBuyer,
  checkAuth,
  redirectIfAuthenticated
};
