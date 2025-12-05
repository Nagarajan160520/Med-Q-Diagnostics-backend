// backend/routes/referrals.js - NEW FILE
const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');

// GET /api/referrals - Get all referral appointments
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all referrals from database...');
    
    const referrals = await Referral.find().sort({ createdAt: -1 });
    
    console.log(`✅ Found ${referrals.length} referrals in database`);
    
    res.json({
      success: true,
      count: referrals.length,
      data: referrals
    });
  } catch (error) {
    console.error('❌ Error fetching referrals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching referrals from database'
    });
  }
});

// POST /api/referrals - Create new referral
router.post('/', async (req, res) => {
  try {
    console.log('📤 Creating new referral in database:', req.body);
    
    const {
      patientName,
      patientEmail,
      patientPhone,
      patientAge,
      patientGender,
      referringDoctor,
      referralHospital,
      medicalCondition,
      urgency,
      preferredDate,
      preferredTime,
      additionalNotes
    } = req.body;

    // Validation
    if (!patientName || !patientEmail || !patientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Patient name, email and phone are required'
      });
    }

    const referralData = {
      patientName,
      patientEmail,
      patientPhone,
      patientAge: patientAge || null,
      patientGender: patientGender || '',
      referringDoctor: referringDoctor || '',
      referralHospital: referralHospital || '',
      medicalCondition: medicalCondition || '',
      urgency: urgency || 'normal',
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || '',
      additionalNotes: additionalNotes || '',
      status: 'pending'
    };

    const referral = new Referral(referralData);
    await referral.save();
    
    console.log('✅ Referral saved to database:', referral._id);
    
    res.status(201).json({
      success: true,
      message: 'Referral created successfully',
      data: referral
    });
  } catch (error) {
    console.error('❌ Error creating referral:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating referral in database'
    });
  }
});

// PUT /api/referrals/:id - Update referral status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    console.log(`🔄 Updating referral ${req.params.id} to status: ${status}`);
    
    const referral = await Referral.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }
    
    console.log('✅ Referral status updated successfully');
    
    res.json({
      success: true,
      message: 'Referral status updated successfully',
      data: referral
    });
  } catch (error) {
    console.error('❌ Error updating referral:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating referral status'
    });
  }
});

// DELETE /api/referrals/:id - Delete referral
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ Deleting referral: ${req.params.id}`);
    
    const referral = await Referral.findByIdAndDelete(req.params.id);
    
    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }
    
    console.log('✅ Referral deleted from database');
    
    res.json({
      success: true,
      message: 'Referral deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting referral:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting referral from database'
    });
  }
});

module.exports = router;