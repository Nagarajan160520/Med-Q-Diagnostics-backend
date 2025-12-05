// routes/settings.js - SIMPLE VERSION (No authorize issues)
const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/settings
// @desc    Get system settings
// @access  Private
router.get('/', settingsController.getSettings);

// @route   PUT /api/settings/update
// @desc    Update system settings
// @access  Private
router.put('/update', settingsController.updateSettings);

// @route   POST /api/settings/reset
// @desc    Reset settings to defaults
// @access  Private
router.post('/reset', settingsController.resetSettings);

// @route   GET /api/settings/:key
// @desc    Get specific setting
// @access  Private
router.get('/:key', settingsController.getSetting);

module.exports = router;