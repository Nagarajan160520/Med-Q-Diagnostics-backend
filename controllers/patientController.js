// controllers/patientController.js - Patient controller
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Test = require('../models/Test');
const Report = require('../models/Report');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
exports.getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [patients, total] = await Promise.all([
      Patient.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Patient.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: patients.length,
      data: {
        patients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        patient
      }
    });

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message
    });
  }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private/Public
exports.createPatient = async (req, res) => {
  try {
    console.log('🎯 Received patient data:', req.body);
    
    const {
      name,
      email,
      phone,
      age,
      gender,
      address,
      bloodGroup
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !age || !gender) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, age, gender'
      });
    }

    // Check if patient already exists (optional - you can remove if not needed)
    const existingPatient = await Patient.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingPatient) {
      console.log('❌ Patient already exists:', existingPatient._id);
      return res.status(400).json({
        success: false,
        message: 'Patient with this email or phone already exists'
      });
    }

    // Create patient with the exact fields matching your schema
    const patientData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      age: parseInt(age),
      gender: gender,
      bloodGroup: bloodGroup || '',  // Optional field
      address: address || ''  // Optional field
    };

    console.log('📝 Creating patient with data:', patientData);

    const patient = await Patient.create(patientData);

    console.log('✅ Patient created successfully:', patient._id);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient  // Send the created patient back
    });

  } catch (error) {
    console.error('💥 Patient creation error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value. Patient with this email or phone already exists.',
        error: error.keyValue
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating patient',
      error: error.message
    });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: {
        patient
      }
    });

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating patient',
      error: error.message
    });
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private/Admin
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting patient',
      error: error.message
    });
  }
};

// @desc    Get patient dashboard
// @route   GET /api/patients/:id/dashboard
// @access  Private
exports.getPatientDashboard = async (req, res) => {
  try {
    const patientId = req.params.id;

    const [patient, appointments, tests, reports] = await Promise.all([
      Patient.findById(patientId),
      Appointment.find({ patient: patientId })
        .populate('doctor', 'name specialization department')
        .sort({ appointmentDate: -1 })
        .limit(5),
      Test.find({ patient: patientId })
        .sort({ scheduledDate: -1 })
        .limit(5),
      Report.find({ patient: patientId })
        .populate('doctor', 'name')
        .sort({ reportDate: -1 })
        .limit(5)
    ]);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        patient,
        recentAppointments: appointments,
        recentTests: tests,
        recentReports: reports
      }
    });

  } catch (error) {
    console.error('Patient dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient dashboard',
      error: error.message
    });
  }
};

// @desc    Get patient medical history
// @route   GET /api/patients/:id/medical-history
// @access  Private
exports.getMedicalHistory = async (req, res) => {
  try {
    const patientId = req.params.id;

    const [appointments, tests, reports] = await Promise.all([
      Appointment.find({ patient: patientId })
        .populate('doctor', 'name specialization')
        .sort({ appointmentDate: -1 }),
      Test.find({ patient: patientId })
        .sort({ scheduledDate: -1 }),
      Report.find({ patient: patientId })
        .populate('doctor', 'name')
        .sort({ reportDate: -1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        tests,
        reports
      }
    });

  } catch (error) {
    console.error('Medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medical history',
      error: error.message
    });
  }
};