// models/Patient.js
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: false
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  address: {
    type: String,
    required: false
  },
  bloodGroup: {  // ✅ BLOOD GROUP FIELD ADD 
    type: String,
    required: false,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', '']
  },
  medicalHistory: {
    type: [String],
    default: []
  },
  allergies: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);