// controllers/staffController.js - Staff controller
const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const Appointment = require('../models/Appointment');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private
exports.getAllStaff = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { role, department, isActive } = req.query;

    let query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';

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

// @desc    Get single staff member
// @route   GET /api/staff/:id
// @access  Private
exports.getStaff = async (req, res) => {
  try {
    // ✅ ID validation add pannu
    const { id } = req.params;
    
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID format'
      });
    }

    const staff = await Staff.findById(id).select('-password');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { 
        staff
      }
    });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff member',
      error: error.message
    });
  }
};

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private/Admin
exports.createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      specialization,
      department,
      qualification,
      experience,
      licenseNumber,
      address,
      dateOfBirth,
      salary,
      shift,
      availableSlots
    } = req.body;

    // Check if staff already exists
    const existingStaff = await Staff.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff member with this email or phone already exists'
      });
    }

    // Check license number uniqueness for doctors
    if (licenseNumber) {
      const existingLicense = await Staff.findOne({ licenseNumber });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: 'License number already exists'
        });
      }
    }

    const staff = await Staff.create({
      name,
      email,
      phone,
      role,
      specialization,
      department,
      qualification,
      experience,
      licenseNumber,
      address,
      dateOfBirth,
      salary,
      shift,
      availableSlots
    });

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
// @route   PUT /api/staff/:id
// @access  Private/Admin
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
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
// @route   DELETE /api/staff/:id
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

// @desc    Get staff by role
// @route   GET /api/staff/role/:role
// @access  Private
exports.getStaffByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { department } = req.query;

    let query = { role, isActive: true };
    if (department) query.department = department;

    const staff = await Staff.find(query)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      data: {
        staff
      }
    });

  } catch (error) {
    console.error('Get staff by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff by role',
      error: error.message
    });
  }
};

// @desc    Get doctors list
// @route   GET /api/staff/doctors
// @access  Private
exports.getDoctors = async (req, res) => {
  try {
    const { department, specialization } = req.query;

    let query = { role: 'doctor', isActive: true };
    if (department) query.department = department;
    if (specialization) query.specialization = specialization;

    const doctors = await Staff.find(query)
      .select('name email phone specialization department qualification experience availableSlots')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: {
        doctors
      }
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
};

// @desc    Get staff dashboard
// @route   GET /api/staff/:id/dashboard
// @access  Private
exports.getStaffDashboard = async (req, res) => {
  try {
    const staffId = req.params.id;

    const [staff, todayAppointments, upcomingAppointments] = await Promise.all([
      Staff.findById(staffId),
      Appointment.find({
        doctor: staffId,
        appointmentDate: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      })
      .populate('patient', 'name email phone age gender')
      .sort({ appointmentTime: 1 }),
      Appointment.find({
        doctor: staffId,
        appointmentDate: { $gt: new Date() },
        status: { $in: ['scheduled', 'confirmed'] }
      })
      .populate('patient', 'name email phone')
      .sort({ appointmentDate: 1 })
      .limit(10)
    ]);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        staff,
        todayAppointments,
        upcomingAppointments
      }
    });

  } catch (error) {
    console.error('Staff dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff dashboard',
      error: error.message
    });
  }
};

// @desc    Update staff availability
// @route   PUT /api/staff/:id/availability
// @access  Private
exports.updateAvailability = async (req, res) => {
  try {
    const { availableSlots } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { availableSlots },
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
      message: 'Availability updated successfully',
      data: {
        staff
      }
    });

  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating availability',
      error: error.message
    });
  }
};