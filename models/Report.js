const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  doctorName: {
    type: String, 
    required: [true, 'Doctor name is required'],
    trim: true
  },
  reportType: {
    type: String,
    required: [true, 'Report type is required'],
    trim: true
  },
  testType: {
    type: String,
    trim: true
  },
  findings: {
    type: String,
    required: [true, 'Findings are required'],
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  recommendations: {
    type: String,
    trim: true
  },
  amount: {
    type: String,
    required: [true, 'Amount is required'],
    trim: true
  },
  reportDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'generated', 'reviewed', 'approved', 'archived'],
    default: 'generated'
  },
  isCritical: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes
reportSchema.index({ patientName: 1, reportDate: -1 });
reportSchema.index({ doctorName: 1 });
reportSchema.index({ reportType: 1 });

module.exports = mongoose.model('Report', reportSchema);