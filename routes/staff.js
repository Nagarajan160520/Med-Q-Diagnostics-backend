// routes/staff.js - Staff routes
const express = require('express');
const router = express.Router();


// Import controllers and middleware
const staffController = require('../controllers/staffController');
const { protect, restrictTo } = require('../middleware/auth');
const { 
  validateStaff, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');

// Import Staff model
const Staff = require('../models/Staff');

// Apply protection to all routes
router.use(protect);

// GET /api/staff - Get all staff members (Admin only)
router.get(
  '/',
  restrictTo('admin'),
  validatePagination,
  staffController.getAllStaff
);

// GET /api/staff/:id - Get single staff member
router.get(
  '/:id',
  validateId,
  staffController.getStaff
);

// POST /api/staff - Create new staff member (Admin only)
router.post(
  '/',
  restrictTo('admin'),
  validateStaff,
  staffController.createStaff
);

// PUT /api/staff/:id - Update staff member (Admin only)
router.put(
  '/:id',
  restrictTo('admin'),
  validateId,
  validateStaff,
  staffController.updateStaff
);

// DELETE /api/staff/:id - Delete staff member (Admin only)
router.delete(
  '/:id',
  restrictTo('admin'),
  validateId,
  staffController.deleteStaff
);

// GET /api/staff/doctors - Get doctors list (FIXED)
router.get('/doctors', async (req, res) => {
  try {
    console.log('🔄 GET /api/staff/doctors - Fetching doctors from database...');
    
    // Find all staff with role 'doctor'
    const doctors = await Staff.find({ role: 'doctor' })
      .select('name specialization email phone department qualification experience')
      .sort({ name: 1 });

    console.log('✅ Doctors found:', doctors.length);
    
    // ✅ SIMPLIFIED RESPONSE - Frontend ku easy ah read panna
    res.json({
      success: true,
      count: doctors.length,
      doctors: doctors  // ✅ Direct array ah send pannu
    });

  } catch (error) {
    console.error('❌ Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctors',
      error: error.message
    });
  }
}); 

// GET /api/staff/:id/dashboard - Get staff dashboard
router.get(
  '/:id/dashboard',
  validateId,
  staffController.getStaffDashboard
);

// PUT /api/staff/:id/availability - Update staff availability
router.put(
  '/:id/availability',
  validateId,
  staffController.updateAvailability
);

module.exports = router;