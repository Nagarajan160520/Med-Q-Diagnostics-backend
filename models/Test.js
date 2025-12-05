// models/Test.js - Test model
const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required']
  },
  testName: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true
  },
  testType: {
    type: String,
    required: [true, 'Test type is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Test description is required'],
    trim: true
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'pending'],
    default: 'scheduled'
  },
  results: {
    type: String,
    trim: true,
    default: ''
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  lab: {
    name: String,
    address: String,
    contact: String
  },
  sampleType: {
    type: String,
    enum: ['blood', 'urine', 'tissue', 'saliva', 'other'],
    default: 'blood'
  },
  sampleCollected: {
    type: Boolean,
    default: false
  },
  sampleCollectionDate: Date,
  reportReady: {
    type: Boolean,
    default: false
  },
  reportDate: Date,
  normalRange: {
    type: String,
    trim: true
  },
  units: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
testSchema.index({ patient: 1, scheduledDate: -1 });
testSchema.index({ status: 1 });
testSchema.index({ testType: 1 });
testSchema.index({ technician: 1 });
testSchema.index({ scheduledDate: 1 });

// Virtual for formatted scheduled date
testSchema.virtual('formattedScheduledDate').get(function() {
  return this.scheduledDate.toLocaleDateString('en-IN');
});

// Virtual for test duration (in days)
testSchema.virtual('duration').get(function() {
  if (this.sampleCollectionDate && this.reportDate) {
    const duration = (this.reportDate - this.sampleCollectionDate) / (1000 * 60 * 60 * 24);
    return Math.ceil(duration);
  }
  return null;
});

// Method to check if test is overdue
testSchema.methods.isOverdue = function() {
  if (this.status === 'scheduled' && this.scheduledDate < new Date()) {
    return true;
  }
  return false;
};

// Static method to get tests by status
testSchema.statics.getTestsByStatus = function(status) {
  return this.find({ status }).populate('patient', 'name email phone');
};

// Static method to get pending tests count
testSchema.statics.getPendingTestsCount = function() {
  return this.countDocuments({ status: { $in: ['scheduled', 'in-progress', 'pending'] } });
};

// Static method to get today's tests
testSchema.statics.getTodaysTests = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    scheduledDate: {
      $gte: today,
      $lt: tomorrow
    }
  }).populate('patient', 'name email phone');
};

// Pre-save middleware to update report date when status changes to completed
testSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.reportDate) {
    this.reportDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Test', testSchema);