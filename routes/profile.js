// routes/profile.js - Profile-specific routes
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', profileController.getMyProfile);

// @route   PUT /api/profile/update
// @desc    Update user profile
// @access  Private
router.put('/update', profileController.updateProfile);

// @route   POST /api/profile/avatar
// @desc    Upload profile avatar
// @access  Private
router.post('/avatar', profileController.uploadAvatar);

// @route   PUT /api/profile/preferences
// @desc    Update profile preferences
// @access  Private
router.put('/preferences', profileController.updatePreferences);

// @route   GET /api/profile/public/:userId
// @desc    Get public profile
// @access  Public
router.get('/public/:userId', profileController.getPublicProfile);

module.exports = router;