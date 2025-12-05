// routes/appointments.js - UPDATED WITH BLOOD GROUP
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

// POST /api/appointments - WITH BLOOD GROUP SUPPORT
router.post('/', async (req, res) => {
  try {
    console.log('🎯 ========== APPOINTMENT REQUEST START ==========');

    let { 
      patientName, patientEmail, patientPhone, patientGender, 
      patientAge, patientDOB, patientAddress, patientBloodGroup, // ✅ BLOOD GROUP ADDED
      appointmentDate, appointmentTime, reason, type, notes
    } = req.body;

    // STEP 1: Validate required fields
    if (!patientName || !patientEmail || !patientPhone || !patientGender || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    console.log('✅ All required fields present');
    console.log('🩸 Blood Group from form:', patientBloodGroup);

    // STEP 2: Find or create patient - WITH BLOOD GROUP
    let patient = null;
    
    try {
      // Try to find patient by email or phone
      const existingPatient = await Patient.findOne({ 
        $or: [
          { email: patientEmail },
          { phone: patientPhone }
        ]
      });
      
      if (existingPatient) {
        console.log('✅ Existing patient found:', existingPatient._id);
        patient = existingPatient._id;
        
        // ✅ COMPLETE patient details update WITH BLOOD GROUP
        const updateData = {
          name: patientName,
          email: patientEmail,
          phone: patientPhone,
          gender: patientGender,
          age: patientAge && patientAge !== '' ? parseInt(patientAge) : null,
          dateOfBirth: patientDOB && patientDOB !== '' ? new Date(patientDOB) : null,
          address: patientAddress && patientAddress !== '' ? patientAddress : 'Not provided',
          bloodGroup: patientBloodGroup && patientBloodGroup !== '' ? patientBloodGroup : 'Not Specified' // ✅ BLOOD GROUP
        };
        
        console.log('🔄 Updating patient with:', updateData);
        await Patient.findByIdAndUpdate(patient, updateData, { new: true });
        
      } else {
        console.log('🔄 Creating new patient...');
        
        const newPatient = new Patient({
          name: patientName,
          email: patientEmail,
          phone: patientPhone,
          gender: patientGender,
          age: patientAge && patientAge !== '' ? parseInt(patientAge) : null,
          dateOfBirth: patientDOB && patientDOB !== '' ? new Date(patientDOB) : null,
          address: patientAddress && patientAddress !== '' ? patientAddress : 'Not provided',
          bloodGroup: patientBloodGroup && patientBloodGroup !== '' ? patientBloodGroup : 'Not Specified' // ✅ BLOOD GROUP
        });

        const savedPatient = await newPatient.save();
        patient = savedPatient._id;
        console.log('✅ New patient created:', patient);
      }
    } catch (patientError) {
      console.error('❌ Patient processing error:', patientError);
      throw new Error('Patient creation failed: ' + patientError.message);
    }

    // STEP 3: Create appointment
    const newAppointment = new Appointment({
      patient: patient,
      doctor: null,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      reason: reason,
      type: type || 'consultation',
      notes: notes || '',
      status: 'scheduled'
    });

    const savedAppointment = await newAppointment.save();
    console.log('✅ Appointment saved to DB');

    // STEP 4: PROPER POPULATION WITH BLOOD GROUP
    const populatedAppointment = await Appointment.findById(savedAppointment._id)
      .populate({
        path: 'patient',
        select: 'name email phone gender age dateOfBirth address bloodGroup' // ✅ BLOOD GROUP INCLUDED
      })
      .lean();

    console.log('📤 FINAL POPULATED DATA:', {
      name: populatedAppointment.patient.name,
      gender: populatedAppointment.patient.gender,
      age: populatedAppointment.patient.age,
      dob: populatedAppointment.patient.dateOfBirth,
      address: populatedAppointment.patient.address,
      bloodGroup: populatedAppointment.patient.bloodGroup // ✅ BLOOD GROUP
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: populatedAppointment
    });

  } catch (error) {
    console.error('❌ APPOINTMENT ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment: ' + error.message
    });
  }
});

// GET /api/appointments - WITH BLOOD GROUP
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all appointments...');
    
    const appointments = await Appointment.find()
      .populate({
        path: 'patient',
        select: 'name email phone gender age dateOfBirth address bloodGroup' // ✅ BLOOD GROUP INCLUDED
      })
      .sort({ appointmentDate: -1, createdAt: -1 })
      .lean();

    console.log(`✅ Found ${appointments.length} appointments`);
    
    // Debug: Check patient data with blood group
    if (appointments.length > 0) {
      appointments.forEach((appt, index) => {
        console.log(`📊 Appointment ${index + 1} Patient:`, {
          name: appt.patient?.name || 'N/A',
          gender: appt.patient?.gender || 'Not specified',
          age: appt.patient?.age || 'Not specified', 
          dob: appt.patient?.dateOfBirth || 'Not specified',
          address: appt.patient?.address || 'Not provided',
          bloodGroup: appt.patient?.bloodGroup || 'Not specified' // ✅ BLOOD GROUP
        });
      });
    }

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments'
    });
  }
});


// routes/appointments.js - DELETE route
router.delete('/:id', async (req, res) => {
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
});

module.exports = router;