// models/Staff.js - Staff model
const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: {
    type: String,
    required: [true, 'Staff name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['doctor', 'nurse', 'technician', 'receptionist', 'admin', 'pharmacist']
  },
  specialization: {
    type: String,
    required: function() {
      return this.role === 'doctor';
    }
  },
  department: {
    type: String,
    required: [true, 'Department is required']
  },
qualification: {
  type: mongoose.Schema.Types.Mixed, // ✅ Accept both string and array
  default: []
},
  experience: {
    type: Number, // in years
    default: 0
  },
  licenseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  dateOfBirth: Date,
  dateOfJoining: {
    type: Date,
    default: Date.now
  },
  salary: {
    type: Number,
    min: 0
  },
  shift: {
    type: String,
    enum: ['morning', 'evening', 'night', 'general'],
    default: 'general'
  },
  availableSlots: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    startTime: String,
    endTime: String,
    breakStart: String,
    breakEnd: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  }
}, {
  timestamps: true
});

// Index for better search
staffSchema.index({ email: 1 });
staffSchema.index({ department: 1, role: 1 });
staffSchema.index({ specialization: 1 });

module.exports = mongoose.model('Staff', staffSchema);