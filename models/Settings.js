// models/Settings.js - Settings Model
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required'],
    default: 'Advanced Lab Diagnostic Center'
  },
  hospitalEmail: {
    type: String,
    required: [true, 'Hospital email is required'],
    default: 'info@advancedlab.com'
  },
  hospitalPhone: {
    type: String,
    required: [true, 'Hospital phone is required'],
    default: '+91-6381095854'
  },
  hospitalAddress: {
    type: String,
    default: 'Madurai Rd, kadaiyanallur, Tamilnadu-627751'
  },
  appointmentDuration: {
    type: Number,
    default: 30,
    min: [15, 'Minimum appointment duration is 15 minutes'],
    max: [120, 'Maximum appointment duration is 120 minutes']
  },
  workingHours: {
    start: {
      type: String,
      default: '08:00'
    },
    end: {
      type: String,
      default: '20:00'
    }
  },
  smsNotifications: {
    type: Boolean,
    default: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  autoBackup: {
    type: Boolean,
    default: true
  },
  backupFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  dateFormat: {
    type: String,
    default: 'DD/MM/YYYY',
    enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
  },
  maxAppointmentsPerDay: {
    type: Number,
    default: 100,
    min: [10, 'Minimum appointments per day is 10'],
    max: [200, 'Maximum appointments per day is 200']
  },
  emergencyContact: {
    type: String,
    default: '6381095854'
  },
  labSettings: {
    reportValidity: {
      type: Number,
      default: 30,
      min: 1,
      max: 365
    },
    criticalResultAlert: {
      type: Boolean,
      default: true
    },
    autoGenerateReports: {
      type: Boolean,
      default: false
    }
  },
  billingSettings: {
    taxRate: {
      type: Number,
      default: 18,
      min: 0,
      max: 50
    },
    discountEligibility: {
      type: Boolean,
      default: true
    },
    paymentModes: [{
      type: String,
      enum: ['cash', 'card', 'upi', 'netbanking']
    }]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Only one settings document for the entire system
settingsSchema.statics.getSettings = function() {
  return this.findOne().sort({ createdAt: -1 });
};

settingsSchema.statics.updateSettings = function(updateData) {
  return this.findOneAndUpdate(
    {},
    updateData,
    { 
      new: true, 
      runValidators: true,
      upsert: true // Create if doesn't exist
    }
  );
};

// Update lastUpdated before saving
settingsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);