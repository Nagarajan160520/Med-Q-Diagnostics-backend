// controllers/adminController.js - COMPLETE FIXED VERSION
const User = require('../models/User');
const Patient = require('../models/Patient');
const Staff = require('../models/Staff');
const Appointment = require('../models/Appointment');
const Test = require('../models/Test');
const Report = require('../models/Report');

// ✅ GET DASHBOARD STATS (FIXED)
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats for admin:', req.user.name);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all counts in parallel
    const [
      totalPatients,
      totalStaff,
      totalAppointments,
      todayAppointments,
      pendingTests,
      completedTests,
      revenueResult
    ] = await Promise.all([
      Patient.countDocuments(),
      Staff.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({
        appointmentDate: { $gte: today, $lt: tomorrow }
      }),
      Test.countDocuments({ status: 'pending' }),
      Test.countDocuments({ status: 'completed' }),
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
      .limit(10);
    
    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Calculate revenue
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalPatients,
          totalStaff,
          totalAppointments,
          todayAppointments,
          pendingTests,
          completedTests,
          totalRevenue
        },
        recentAppointments,
        recentPatients
      }
    });
    
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
};

// ✅ GET ALL PATIENTS
exports.getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build search query
    const query = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { 'address.city': searchRegex }
      ];
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
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: patients
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
};

// ✅ GET SINGLE PATIENT
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Get patient appointments
    const appointments = await Appointment.find({ patient: req.params.id })
      .populate('doctor', 'name specialization');
    
    // Get patient tests
    const tests = await Test.find({ patient: req.params.id })
      .populate('technician', 'name');
    
    // Get patient reports
    const reports = await Report.find({ patient: req.params.id })
      .populate('doctor', 'name');
    
    res.status(200).json({
      success: true,
      data: {
        patient,
        appointments,
        tests,
        reports
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient',
      error: error.message
    });
  }
};

// ✅ UPDATE PATIENT
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
      data: patient
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating patient',
      error: error.message
    });
  }
};

// ✅ DELETE PATIENT
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Also delete related appointments, tests, reports
    await Promise.all([
      Appointment.deleteMany({ patient: req.params.id }),
      Test.deleteMany({ patient: req.params.id }),
      Report.deleteMany({ patient: req.params.id })
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Patient and related records deleted'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting patient',
      error: error.message
    });
  }
};

// ✅ GET ALL STAFF
exports.getAllStaff = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.department) query.department = req.query.department;
    if (req.query.search) {
      query.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') },
        { employeeId: new RegExp(req.query.search, 'i') }
      ];
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
      count: staff.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: staff
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff',
      error: error.message
    });
  }
};

// ✅ CREATE STAFF
exports.createStaff = async (req, res) => {
  try {
    console.log('📝 Creating staff:', req.body);
    
    // Check if email already exists
    const existingStaff = await Staff.findOne({ email: req.body.email });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    const staff = await Staff.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: staff
    });
    
  } catch (error) {
    console.error('❌ Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating staff',
      error: error.message
    });
  }
};

// ✅ UPDATE STAFF
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
        message: 'Staff not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      data: staff
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating staff',
      error: error.message
    });
  }
};

// ✅ DELETE STAFF
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting staff',
      error: error.message
    });
  }
};

// ✅ GET ALL APPOINTMENTS
exports.getAllAppointments = async (req, res) => {
  try {
    const { date, status, doctor, patient, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }
    if (status) query.status = status;
    if (doctor) query.doctor = doctor;
    if (patient) query.patient = patient;
    
    const skip = (page - 1) * limit;
    
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'name email phone')
        .populate('doctor', 'name specialization department')
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: appointments
    });
    
  } catch (error) {
    console.error('❌ Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// ✅ CREATE APPOINTMENT (ADMIN)
exports.createAppointment = async (req, res) => {
  try {
    console.log('📅 Creating appointment:', req.body);
    
    // Check if patient exists
    const patientExists = await Patient.findById(req.body.patient);
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Check if doctor exists
    if (req.body.doctor) {
      const doctorExists = await Staff.findById(req.body.doctor);
      if (!doctorExists || !['doctor', 'surgeon'].includes(doctorExists.role)) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
    }
    
    // Check for conflicting appointments
    const existingAppointment = await Appointment.findOne({
      doctor: req.body.doctor,
      appointmentDate: req.body.appointmentDate,
      appointmentTime: req.body.appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });
    
    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Doctor already has an appointment at this time'
      });
    }
    
    const appointmentData = {
      ...req.body,
      createdBy: req.user._id,
      user: req.user._id
    };
    
    const appointment = await Appointment.create(appointmentData);
    
    // Populate the response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization department');
    
    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: populatedAppointment
    });
    
  } catch (error) {
    console.error('❌ Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
};

// ✅ UPDATE APPOINTMENT
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patient', 'name email phone')
     .populate('doctor', 'name specialization');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
    
  } catch (error) {
    console.error('❌ Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: error.message
    });
  }
};

// ✅ DELETE APPOINTMENT
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
    console.error('❌ Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting appointment',
      error: error.message
    });
  }
};

// ✅ GET ALL TESTS
exports.getAllTests = async (req, res) => {
  try {
    const { status, patient, technician, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (patient) query.patient = patient;
    if (technician) query.technician = technician;
    
    const skip = (page - 1) * limit;
    
    const [tests, total] = await Promise.all([
      Test.find(query)
        .populate('patient', 'name email phone')
        .populate('technician', 'name department')
        .sort({ scheduledDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Test.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      count: tests.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: tests
    });
    
  } catch (error) {
    console.error('❌ Get tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tests',
      error: error.message
    });
  }
};

// ✅ CREATE TEST
exports.createTest = async (req, res) => {
  try {
    console.log('🧪 Creating test:', req.body);
    
    // Check if patient exists
    const patientExists = await Patient.findById(req.body.patient);
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    const test = await Test.create(req.body);
    
    const populatedTest = await Test.findById(test._id)
      .populate('patient', 'name email phone')
      .populate('technician', 'name department');
    
    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: populatedTest
    });
    
  } catch (error) {
    console.error('❌ Create test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test',
      error: error.message
    });
  }
};

// ✅ UPDATE TEST
exports.updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patient', 'name email phone')
     .populate('technician', 'name department');
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Test updated successfully',
      data: test
    });
    
  } catch (error) {
    console.error('❌ Update test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating test',
      error: error.message
    });
  }
};

// ✅ DELETE TEST
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
    console.error('❌ Delete test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting test',
      error: error.message
    });
  }
};

// ✅ GET ALL REPORTS
exports.getAllReports = async (req, res) => {
  try {
    const { patient, doctor, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (patient) query.patient = patient;
    if (doctor) query.doctor = doctor;
    
    const skip = (page - 1) * limit;
    
    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('patient', 'name email phone age gender')
        .populate('doctor', 'name specialization department')
        .sort({ reportDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Report.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: reports
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

// ✅ CREATE REPORT
exports.createReport = async (req, res) => {
  try {
    console.log('📄 Creating report:', req.body);
    
    // Check if patient exists
    const patientExists = await Patient.findById(req.body.patient);
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }
    
    // Check if doctor exists
    if (req.body.doctor) {
      const doctorExists = await Staff.findById(req.body.doctor);
      if (!doctorExists || !['doctor', 'surgeon'].includes(doctorExists.role)) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
    }
    
    const report = await Report.create(req.body);
    
    const populatedReport = await Report.findById(report._id)
      .populate('patient', 'name email phone age gender')
      .populate('doctor', 'name specialization department');
    
    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: populatedReport
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

// ✅ UPDATE REPORT
exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patient', 'name email phone')
     .populate('doctor', 'name specialization');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report
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

// ✅ DELETE REPORT
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
    console.error('❌ Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
};

// ✅ GET ALL USERS (ADMIN ONLY)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// ✅ UPDATE USER STATUS
exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `User ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

// ✅ DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Also delete related records based on role
    if (user.role === 'patient') {
      await Patient.deleteOne({ user: req.params.id });
    } else {
      await Staff.deleteOne({ user: req.params.id });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// ✅ RECENT ACTIVITIES
exports.getRecentActivities = async (req, res) => {
  try {
    const [recentAppointments, recentPatients, recentTests, recentStaff] = await Promise.all([
      Appointment.find()
        .populate('patient', 'name')
        .populate('doctor', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      Patient.find().sort({ createdAt: -1 }).limit(10),
      Test.find()
        .populate('patient', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      Staff.find().sort({ createdAt: -1 }).limit(5)
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        appointments: recentAppointments,
        patients: recentPatients,
        tests: recentTests,
        staff: recentStaff
      }
    });
    
  } catch (error) {
    console.error('❌ Recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

// ✅ ANALYTICS
exports.getMonthlyPatientStats = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const stats = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' }
            ]
          },
          patients: '$count'
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly stats',
      error: error.message
    });
  }
};

// ✅ REVENUE STATS
exports.getRevenueStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const revenueStats = await Test.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$price' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      },
      {
        $project: {
          month: '$_id',
          revenue: 1,
          tests: '$count'
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: revenueStats
    });
    
  } catch (error) {
    console.error('❌ Revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue stats',
      error: error.message
    });
  }
};