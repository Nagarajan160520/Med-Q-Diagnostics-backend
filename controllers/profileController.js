// controllers/profileController.js - Profile-specific controller
const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/profile/me
// @access  Private
exports.getMyProfile = async (req, res) => {
  try {
    console.log('🔍 Fetching profile for user:', req.user.id);
    
    let profile = await Profile.getByUserId(req.user.id);
    
    if (!profile) {
      console.log('📝 Creating new profile for user...');
      
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      profile = await Profile.create({
        user: req.user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      });
      
      console.log('✅ New profile created:', profile._id);
    }

    console.log('✅ Profile found:', profile._id);
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        profile: profile.getFullProfile()
      }
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile from database',
      error: error.message
    });
  }
};

// @desc    Update user profile - FIXED AVATAR
// @route   PUT /api/profile/update
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    console.log('📝 Updating profile for user:', req.user.id);
    console.log('📤 Update data received:', Object.keys(req.body));

    const {
      name,
      phone,
      avatar,
      department,
      specialization,
      experience,
      qualification,
      address,
      city,
      state,
      pincode,
      dateOfBirth,
      gender,
      bloodGroup,
      bio,
      socialLinks,
      preferences
    } = req.body;

    // ✅ FIX: Handle base64 avatar properly
    let updateData = {};
    
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (avatar !== undefined) {
      // ✅ Accept both empty string and base64 data
      updateData.avatar = avatar;
      console.log('🖼️ Avatar data length:', avatar ? avatar.length : 0);
    }
    if (department !== undefined) updateData.department = department;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (experience !== undefined) updateData.experience = parseInt(experience) || 0;
    if (qualification !== undefined) updateData.qualification = qualification;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (bio !== undefined) updateData.bio = bio;
    if (socialLinks) updateData.socialLinks = socialLinks;
    if (preferences) updateData.preferences = preferences;

    console.log('💾 Final update data:', Object.keys(updateData));

    // Update profile
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      { 
        new: true, 
        runValidators: true,
        upsert: true
      }
    );
    
    // Also update basic info in User collection
    if (name || phone) {
      await User.findByIdAndUpdate(req.user.id, {
        ...(name && { name }),
        ...(phone && { phone })
      });
    }

    console.log('✅ Profile updated successfully:', updatedProfile._id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: updatedProfile.getFullProfile()
      }
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// @desc    Upload profile avatar - SIMPLIFIED
// @route   POST /api/profile/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    console.log('🖼️ Uploading avatar for user:', req.user.id);
    
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: 'Avatar image is required'
      });
    }

    // ✅ SIMPLE UPDATE - no complex processing
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { avatar: avatar },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data: {
        profile: updatedProfile.getFullProfile()
      }
    });

  } catch (error) {
    console.error('❌ Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading avatar',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get public profile
// @route   GET /api/profile/public/:userId
// @access  Public
exports.getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.getByUserId(userId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        profile: profile.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('❌ Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching public profile',
      error: error.message
    });
  }
};

// @desc    Update profile preferences
// @route   PUT /api/profile/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    console.log('⚙️ Updating preferences for user:', req.user.id);
    
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: 'Preferences data is required'
      });
    }

    const updatedProfile = await Profile.updateProfile(req.user.id, { preferences });

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        profile: updatedProfile.getFullProfile()
      }
    });

  } catch (error) {
    console.error('❌ Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
      error: error.message
    });
  }
};