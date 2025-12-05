// backend/models/Referral.js - NEW FILE
const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  patientEmail: {
    type: String,
    required: true,
    trim: true
  },
  patientPhone: {
    type: String,
    required: true,
    trim: true
  },
  patientAge: {
    type: Number,
    required: false
  },
  patientGender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: false
  },
  referringDoctor: {
    type: String,
    required: false,
    trim: true
  },
  referralHospital: {
    type: String,
    required: false,
    trim: true
  },
  medicalCondition: {
    type: String,
    required: false,
    trim: true
  },
  urgency: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal'
  },
  preferredDate: {
    type: Date,
    required: false
  },
  preferredTime: {
    type: String,
    required: false
  },
  additionalNotes: {
    type: String,
    required: false,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Referral', referralSchema);