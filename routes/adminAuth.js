// routes/adminAuth.js - ADMIN ONLY AUTH ROUTES
const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

// ✅ ADMIN LOGIN (Separate from normal login)
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required')
    .custom(email => {
      if (!email.endsWith('@gmail.com')) {
        throw new Error('Admin login requires @gmail.com address');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password required')
], async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔄 Admin login request:', email);
    
    // Find admin user
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'admin' 
    }).select('+password');
    
    if (!user) {
      console.log('❌ No admin found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is deactivated'
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for admin:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Admin login successful:', user.name);
    
    // Send response
    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          department: user.department,
          specialization: user.specialization,
          lastLogin: user.lastLogin
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ ADMIN LOGOUT
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin logged out successfully'
  });
});

// ✅ VERIFY ADMIN TOKEN
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
    
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

module.exports = router;