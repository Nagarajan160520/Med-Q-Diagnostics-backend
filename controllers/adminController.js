// controllers/adminController.js - Admin controller
const User = require('../models/User');
const Patient = require('../models/Patient');
const Staff = require('../models/Staff');
const Appointment = require('../models/Appointment');
const Test = require('../models/Test');
const Report = require('../models/Report');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts using Promise.all for better performance
    const [
      totalPatients,
      totalStaff,
      totalAppointments,
      todayAppointments,
      pendingTests,
      totalRevenue
    ] = await Promise.all([
      Patient.countDocuments(),
      Staff.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      }),
      Test.countDocuments({ status: 'pending' }),
      Test.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    // Get recent activities
    const recentAppointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalPatients,
          totalStaff,
          totalAppointments,
          todayAppointments,
          pendingTests,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        recentAppointments,
        recentPatients
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// @desc    Get all patients with pagination
// @route   GET /api/admin/patients
// @access  Private/Admin
exports.getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (req.query.search) {
      query = {
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
          { phone: { $regex: req.query.search, $options: 'i' } }
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
// @route   GET /api/admin/patients/:id
// @access  Private/Admin
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
      message: 'Error fetching patient details',
      error: error.message
    });
  }
};

// @desc    Update patient
// @route   PUT /api/admin/patients/:id
// @access  Private/Admin
exports.updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
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
// @route   DELETE /api/admin/patients/:id
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

// @desc    Get all staff members
// @route   GET /api/admin/staff
// @access  Private/Admin
exports.getAllStaff = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.department) {
      query.department = req.query.department;
    }

    const [staff, total] = await Promise.all([
      Staff.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Staff.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        staff,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff',
      error: error.message
    });
  }
};

// @desc    Create new staff member
// @route   POST /api/admin/staff
// @access  Private/Admin
exports.createStaff = async (req, res) => {
  try {
    const staff = await Staff.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: {
        staff
      }
    });

  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating staff member',
      error: error.message
    });
  }
};

// @desc    Update staff member
// @route   PUT /api/admin/staff/:id
// @access  Private/Admin
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff member updated successfully',
      data: {
        staff
      }
    });

  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating staff member',
      error: error.message
    });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/admin/staff/:id
// @access  Private/Admin
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });

  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting staff member',
      error: error.message
    });
  }
};

// @desc    Get all appointments
// @route   GET /api/admin/appointments
// @access  Private/Admin
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        appointments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// @desc    Update appointment
// @route   PUT /api/admin/appointments/:id
// @access  Private/Admin
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: {
        appointment
      }
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message
    });
  }
};

// @desc    Create appointment (Admin)
// @route   POST /api/admin/appointments
// @access  Private/Admin
exports.createAppointment = async (req, res) => {
  try {
    const appointmentData = {
      ...req.body,
      user: req.user.id, // Add authenticated user
      createdBy: req.user.id
    };

    const appointment = await Appointment.create(appointmentData);
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: {
        appointment: populatedAppointment
      }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
}; 


// @desc    Delete appointment
// @route   DELETE /api/admin/appointments/:id
// @access  Private/Admin
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting appointment',
      error: error.message
    });
  }
};


// @desc    Get all tests
// @route   GET /api/admin/tests
// @access  Private/Admin
exports.getAllTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .populate('patient', 'name email phone')
      .populate('technician', 'name department')
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        tests
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tests',
      error: error.message
    });
  }
};

// @desc    Update test
// @route   PUT /api/admin/tests/:id
// @access  Private/Admin
exports.updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
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

//create test

exports.createTest = async (req, res) => {
  try {
    const test = await Test.create(req.body);
    
    const populatedTest = await Test.findById(test._id)
      .populate('patient', 'name email phone')
      .populate('technician', 'name department');

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: {
        test: populatedTest
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating test',
      error: error.message
    });
  }
};


// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ reportDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        reports
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

// @desc    Create report
// @route   POST /api/admin/reports
// @access  Private/Admin

exports.createReport = async (req, res) => {
  try {
    const report = await Report.create(req.body);
    
    const populatedReport = await Report.findById(report._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: {
        report: populatedReport
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message
    });
  }
};

// Placeholder methods for other routes
exports.getRecentActivities = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      activities: []
    }
  });
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({
    success: true,
    data: {
      users
    }
  });
};

exports.updateUserStatus = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: req.body.isActive },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
};

exports.getMonthlyPatientStats = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      monthlyStats: []
    }
  });
};

exports.getRevenueStats = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      revenueStats: []
    }
  });
};

// Add these methods to your existing adminController.js

// @desc    Delete appointment
// @route   DELETE /api/admin/appointments/:id
// @access  Private/Admin
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting appointment',
      error: error.message
    });
  }
};

// @desc    Delete test
// @route   DELETE /api/admin/tests/:id
// @access  Private/Admin
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

// @desc    Update report
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: {
        report
      }
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
};

// @desc    Delete report
// @route   DELETE /api/admin/reports/:id
// @access  Private/Admin
exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
};