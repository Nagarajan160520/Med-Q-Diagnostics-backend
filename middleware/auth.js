// middleware/auth.js - Authentication middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.authorization) {
      // If no 'Bearer' prefix, use the whole authorization header
      token = req.headers.authorization;
    }

    console.log('🔐 Token received:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified for user:', decoded.id);

      // Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        console.log('❌ User not found for token');
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.'
        });
      }

      // Check if user changed password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        console.log('❌ Password changed after token issued');
        return res.status(401).json({
          success: false,
          message: 'User recently changed password. Please log in again.'
        });
      }

      // Grant access to protected route
      req.user = currentUser;
      console.log('✅ Access granted to:', currentUser.name);
      next();
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token or token expired.'
      });
    }

  } catch (error) {
    console.error('🚨 Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

// Check if user is logged in (optional)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);
        
        if (currentUser && !currentUser.changedPasswordAfter(decoded.iat)) {
          req.user = currentUser;
        }
      } catch (jwtError) {
        // Token invalid, but continue without user
        console.log('Optional auth - invalid token:', jwtError.message);
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  protect,
  restrictTo,
  optionalAuth
};