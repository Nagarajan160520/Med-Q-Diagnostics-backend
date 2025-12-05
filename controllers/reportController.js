const Report = require('../models/Report');
const mongoose = require('mongoose');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
exports.getAllReports = async (req, res) => {
  try {
    console.log('📋 Fetching all reports...');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { patientName, doctorName, reportType, status } = req.query;

    // Build query
    let query = {};
    if (patientName) query.patientName = { $regex: patientName, $options: 'i' };
    if (doctorName) query.doctorName = { $regex: doctorName, $options: 'i' };
    if (reportType) query.reportType = { $regex: reportType, $options: 'i' };
    if (status) query.status = status;

    console.log('🔍 Query:', query);

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ reportDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(query)
    ]);

    console.log(`✅ Found ${reports.length} reports`);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
}; 

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Private
exports.getReport = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📋 Fetching report:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        report
      }
    });

  } catch (error) {
    console.error('❌ Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
};

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res) => {
  try {
    console.log('📝 Creating new report...');
    console.log('📦 FULL Request body:', req.body);

    const {
      patientName,
      doctorName,
      reportType,
      testType,
      findings,
      diagnosis,
      recommendations,
      status,
      isCritical,
      amount
    } = req.body;

    console.log('💰 Amount received:', amount);

    // ✅ AMOUNT FIELD UM VALIDATE PANNUREN
    if (!patientName || !doctorName || !reportType || !findings || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Patient name, doctor name, report type, findings and amount are required'
      });
    }

    // Create report data with amount
    const reportData = {
      patientName: patientName.trim(),
      doctorName: doctorName.trim(),
      reportType,
      testType: testType || '',
      findings: findings.trim(),
      diagnosis: diagnosis || '',
      recommendations: recommendations || '',
      amount: amount, // ✅ AMOUNT FIELD ADD PANNEN
      status: status || 'generated',
      isCritical: isCritical || false,
      reportDate: new Date()
    };

    console.log('💾 Saving to MongoDB:', reportData);

    // Create report
    const report = await Report.create(reportData);

    console.log('✅ Report created successfully in MongoDB:', report._id);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: {
        report
      }
    });

  } catch (error) {
    console.error('❌ Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message
    });
  }
};

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
exports.updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('📝 Updating report:', id);
    console.log('📦 Update data:', updateData);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log('✅ Report updated successfully');

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: updatedReport
    });

  } catch (error) {
    console.error('❌ Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting report:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log('✅ Report deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
};

// @desc    Get reports by patient name
// @route   GET /api/reports/patient/:patientName
// @access  Private
exports.getReportsByPatient = async (req, res) => {
  try {
    const { patientName } = req.params;
    console.log('📋 Fetching reports for patient:', patientName);

    const reports = await Report.find({ 
      patientName: { $regex: patientName, $options: 'i' } 
    }).sort({ reportDate: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: {
        reports
      }
    });

  } catch (error) {
    console.error('❌ Get patient reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient reports',
      error: error.message
    });
  }
};

// @desc    Get reports by doctor name  
// @route   GET /api/reports/doctor/:doctorName
// @access  Private
exports.getReportsByDoctor = async (req, res) => {
  try {
    const { doctorName } = req.params;
    console.log('📋 Fetching reports for doctor:', doctorName);

    const reports = await Report.find({ 
      doctorName: { $regex: doctorName, $options: 'i' } 
    }).sort({ reportDate: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: {
        reports
      }
    });

  } catch (error) {
    console.error('❌ Get doctor reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor reports',
      error: error.message
    });
  }
};

// @desc    Get critical reports
// @route   GET /api/reports/critical
// @access  Private
exports.getCriticalReports = async (req, res) => {
  try {
    console.log('📋 Fetching critical reports...');

    const reports = await Report.find({ isCritical: true })
      .sort({ reportDate: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: {
        reports
      }
    });

  } catch (error) {
    console.error('❌ Get critical reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching critical reports',
      error: error.message
    });
  }
};