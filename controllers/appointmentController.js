// controllers/appointmentController.js - Appointment controller
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Staff = require('../models/Staff');
const { sendAppointmentConfirmation } = require('../config/email');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
exports.getAllAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, date, doctor } = req.query;

    // Build filter query
    let query = {};
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }
    if (doctor) query.doctor = doctor;

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'name email phone age gender')
        .populate('doctor', 'name specialization department')
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: {
        appointments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone age gender bloodGroup medicalHistory')
      .populate('doctor', 'name specialization department qualification experience');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        appointment
      }
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment',
      error: error.message
    });
  }
};

// controllers/appointmentController.js - Fix create method
exports.createAppointment = async (req, res) => {
  try {
    const {
      patient,
      doctor,
      appointmentDate,
      appointmentTime,
      reason,
      type,
      notes,
      duration,
      user // Get user from request body
    } = req.body;

    console.log('📝 Creating appointment with data:', req.body);

    // Check if patient exists
    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if doctor exists
    const doctorExists = await Staff.findById(doctor);
    if (!doctorExists) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Create appointment - use user from request body or from authenticated user
    const appointmentData = {
      patient,
      doctor,
      appointmentDate,
      appointmentTime,
      reason,
      type: type || 'consultation',
      duration: duration || 30,
      notes: notes || '',
      status: 'scheduled',
      user: user || (req.user ? req.user.id : null), // Use either from body or auth
      createdBy: req.user ? req.user.id : user
    };

    console.log('📝 Final appointment data:', appointmentData);

    const appointment = await Appointment.create(appointmentData);

    // Populate and return response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization');

    console.log('✅ Appointment created successfully:', populatedAppointment);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment: populatedAppointment
      }
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


// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
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

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
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

// @desc    Get appointments by patient
// @route   GET /api/appointments/patient/:patientId
// @access  Private
exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      Appointment.find({ patient: patientId })
        .populate('doctor', 'name specialization department')
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments({ patient: patientId })
    ]);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient appointments',
      error: error.message
    });
  }
};

// @desc    Get appointments by doctor
// @route   GET /api/appointments/doctor/:doctorId
// @access  Private
exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, status } = req.query;

    let query = { doctor: doctorId };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone age gender')
      .sort({ appointmentTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: {
        appointments
      }
    });

  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor appointments',
      error: error.message
    });
  }
};

// @desc    Get today's appointments
// @route   GET /api/appointments/today
// @access  Private
exports.getTodaysAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('patient', 'name email phone age gender')
    .populate('doctor', 'name specialization department')
    .sort({ appointmentTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: {
        appointments
      }
    });

  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today appointments',
      error: error.message
    });
  }
};