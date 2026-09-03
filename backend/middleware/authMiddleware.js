const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'flavora_secret_key');
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied: Admin role required' });
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    const userRole = (req.user.role || '').toLowerCase();
    const isAllowed = allowedRoles.some(r => r.toLowerCase() === userRole || userRole === 'admin');
    if (isAllowed) {
      return next();
    }
    return res.status(403).json({ success: false, message: `Access denied: Requires ${allowedRoles.join(' or ')} role` });
  };
};

module.exports = { protect, adminOnly, requireRole };
