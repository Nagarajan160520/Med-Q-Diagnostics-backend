// controllers/testController.js - Test controller
const Test = require('../models/Test');
const Patient = require('../models/Patient');
const Staff = require('../models/Staff');
const { sendTestResultsNotification } = require('../config/email');

// @desc    Get all tests
// @route   GET /api/tests
// @access  Private
exports.getAllTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .populate('patient', 'name email phone')
      .populate('technician', 'name')
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      count: tests.length,
      data: {
        tests
      }
    });

  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tests',
      error: error.message
    });
  }
};

// @desc    Get single test
// @route   GET /api/tests/:id
// @access  Private
exports.getTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('patient', 'name email phone age gender bloodGroup')
      .populate('technician', 'name department qualification');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        test
      }
    });

  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test',
      error: error.message
    });
  }
};

// @desc    Create new test
// @route   POST /api/tests
// @access  Private
exports.createTest = async (req, res) => {
  try {
    const {
      patient,
      testName,
      testType,
      description,
      scheduledDate,
      price,
      sampleType,
      priority
    } = req.body;

    // Check if patient exists
    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Create test
    const test = await Test.create({
      patient,
      testName,
      testType,
      description: description || '',
      scheduledDate,
      price: parseFloat(price),
      sampleType: sampleType || 'blood',
      priority: priority || 'routine',
      status: 'scheduled'
    });

    // Populate the created test
    const populatedTest = await Test.findById(test._id)
      .populate('patient', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Test scheduled successfully',
      data: {
        test: populatedTest
      }
    });

  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test',
      error: error.message
    });
  }
};

// @desc    Update test
// @route   PUT /api/tests/:id
// @access  Private
exports.updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('patient', 'name email phone')
     .populate('technician', 'name department');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Send notification if test is completed and results are available
    if (test.status === 'completed' && test.results) {
      try {
        const patient = await Patient.findById(test.patient);
        await sendTestResultsNotification(test, patient);
      } catch (emailError) {
        console.error('Failed to send test results email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Test updated successfully',
      data: {
        test
      }
    });

  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test',
      error: error.message
    });
  }
};

// @desc    Delete test
// @route   DELETE /api/tests/:id
// @access  Private
exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Test deleted successfully'
    });

  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting test',
      error: error.message
    });
  }
};

// @desc    Get tests by patient
// @route   GET /api/tests/patient/:patientId
// @access  Private
exports.getTestsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [tests, total] = await Promise.all([
      Test.find({ patient: patientId })
        .populate('technician', 'name department')
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limit),
      Test.countDocuments({ patient: patientId })
    ]);

    res.status(200).json({
      success: true,
      data: {
        tests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get patient tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient tests',
      error: error.message
    });
  }
};

// @desc    Update test results
// @route   PUT /api/tests/:id/results
// @access  Private
exports.updateTestResults = async (req, res) => {
  try {
    const { results, status } = req.body;

    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { 
        results,
        status: status || 'completed'
      },
      { new: true, runValidators: true }
    ).populate('patient', 'name email phone');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Send notification email
    try {
      await sendTestResultsNotification(test, test.patient);
    } catch (emailError) {
      console.error('Failed to send test results email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Test results updated successfully',
      data: {
        test
      }
    });

  } catch (error) {
    console.error('Update test results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test results',
      error: error.message
    });
  }
};

// @desc    Get pending tests
// @route   GET /api/tests/pending
// @access  Private
exports.getPendingTests = async (req, res) => {
  try {
    const tests = await Test.find({ 
      status: { $in: ['scheduled', 'in-progress'] } 
    })
    .populate('patient', 'name email phone')
    .populate('technician', 'name department')
    .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      count: tests.length,
      data: {
        tests
      }
    });

  } catch (error) {
    console.error('Get pending tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending tests',
      error: error.message
    });
  }
};