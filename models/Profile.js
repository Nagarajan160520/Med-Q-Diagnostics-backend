// models/Profile.js - FIXED AVATAR FIELD
const mongoose = require('mongoose');
const validator = require('validator');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Phone number must be 10 digits'
    }
  },
  // ✅ FIX: Avatar as simple string for base64
  avatar: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: 'Administration'
  },
  specialization: {
    type: String,
    default: 'Hospital Management'
  },
  experience: {
    type: Number,
    default: 0,
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot be more than 50 years']
  },
  qualification: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male'
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    default: ''
  },
  socialLinks: {
    website: String,
    linkedin: String,
    twitter: String
  },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
  },
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'ta']
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark', 'auto']
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better performance
profileSchema.index({ user: 1 });
profileSchema.index({ email: 1 });
profileSchema.index({ department: 1 });

// Update lastUpdated before saving
profileSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to get profile by user ID
profileSchema.statics.getByUserId = function(userId) {
  return this.findOne({ user: userId });
};

// Static method to update profile
profileSchema.statics.updateProfile = function(userId, updateData) {
  return this.findOneAndUpdate(
    { user: userId },
    updateData,
    { 
      new: true, 
      runValidators: true,
      upsert: true // Create if doesn't exist
    }
  );
};

// Instance method to get public profile
profileSchema.methods.getPublicProfile = function() {
  return {
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    department: this.department,
    specialization: this.specialization,
    experience: this.experience,
    qualification: this.qualification,
    bio: this.bio
  };
};

// Instance method to get full profile
profileSchema.methods.getFullProfile = function() {
  return {
    _id: this._id,
    user: this.user,
    name: this.name,
    email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    department: this.department,
    specialization: this.specialization,
    experience: this.experience,
    qualification: this.qualification,
    address: this.address,
    city: this.city,
    state: this.state,
    pincode: this.pincode,
    dateOfBirth: this.dateOfBirth,
    gender: this.gender,
    bloodGroup: this.bloodGroup,
    bio: this.bio,
    socialLinks: this.socialLinks,
    preferences: this.preferences,
    lastUpdated: this.lastUpdated,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Profile', profileSchema);