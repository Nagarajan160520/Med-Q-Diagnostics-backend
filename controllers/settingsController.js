// controllers/settingsController.js - Settings Controller
const Settings = require('../models/Settings');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private (Admin only)
exports.getSettings = async (req, res) => {
  try {
    console.log('🔧 Fetching system settings...');
    
    let settings = await Settings.getSettings();
    
    // If no settings exist, create default settings
    if (!settings) {
      console.log('📝 Creating default settings...');
      settings = await Settings.create({});
    }

    console.log('✅ Settings retrieved successfully');
    
    res.status(200).json({
      success: true,
      message: 'Settings retrieved successfully',
      data: settings
    });

  } catch (error) {
    console.error('❌ Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings from database',
      error: error.message
    });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings/update
// @access  Private (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    console.log('🔧 Updating system settings...');
    console.log('📤 Update data:', Object.keys(req.body));

    const updateData = { ...req.body };
    updateData.updatedBy = req.user.id; // Track who updated

    console.log('💾 Saving to Settings collection:', Object.keys(updateData));

    const updatedSettings = await Settings.updateSettings(updateData);
    
    console.log('✅ Settings updated successfully');

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully in MongoDB',
      data: updatedSettings
    });

  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings in database',
      error: error.message
    });
  }
};

// @desc    Reset settings to defaults
// @route   POST /api/settings/reset
// @access  Private (Admin only)
exports.resetSettings = async (req, res) => {
  try {
    console.log('🔄 Resetting settings to defaults...');

    // Delete all settings and create new default
    await Settings.deleteMany({});
    const defaultSettings = await Settings.create({});

    console.log('✅ Settings reset to defaults');

    res.status(200).json({
      success: true,
      message: 'Settings reset to default values',
      data: defaultSettings
    });

  } catch (error) {
    console.error('❌ Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting settings',
      error: error.message
    });
  }
};

// @desc    Get specific setting
// @route   GET /api/settings/:key
// @access  Private
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const settings = await Settings.getSettings();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }

    const value = settings[key];
    
    if (value === undefined) {
      return res.status(404).json({
        success: false,
        message: `Setting '${key}' not found`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        key,
        value
      }
    });

  } catch (error) {
    console.error('❌ Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching setting',
      error: error.message
    });
  }
};