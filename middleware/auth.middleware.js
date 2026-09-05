const { verifyToken } = require('../services/token.service');
const User = require('../models/user.model');

// Middleware to attach user if token exists, but allow guests through
const attachUserOptional = async (req, res, next) => {
  const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    res.locals.currentUser = null;
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.clearCookie('token');
    res.locals.currentUser = null;
    return next();
  }

  try {
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (user && user.isActive) {
      req.user = user;
      res.locals.currentUser = user;
    } else {
      res.clearCookie('token');
      res.locals.currentUser = null;
    }
  } catch (err) {
    res.locals.currentUser = null;
  }
  next();
};

// Protect route: user MUST be logged in
const requireAuth = (req, res, next) => {
  if (!req.user) {
    const returnTo = req.originalUrl;
    return res.redirect(`/login?redirect=${encodeURIComponent(returnTo)}`);
  }
  next();
};

module.exports = {
  attachUserOptional,
  requireAuth
};
