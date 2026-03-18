// backend/src/middleware/adminMiddleware.js

const adminOnly = (req, res, next) => {
  // This middleware should be used after the protect middleware
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

module.exports = { adminOnly };