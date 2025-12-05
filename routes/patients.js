// routes/patients.js - Patient routes
const express = require('express');
const router = express.Router();

// Import controllers and middleware
const patientController = require('../controllers/patientController');
const { protect, restrictTo } = require('../middleware/auth');
const { 
  validatePatient, 
  validateId, 
  validatePagination,
  validateSearch 
} = require('../middleware/validation');

// Apply protection to all routes
router.use(protect);

// GET /api/patients - Get all patients (Admin/Staff only)
router.get(
  '/', 
  restrictTo('admin', 'doctor', 'staff'),
  validatePagination,
  validateSearch,
  patientController.getAllPatients
);

// GET /api/patients/:id - Get single patient
router.get(
  '/:id',
  validateId,
  patientController.getPatient
);

// POST /api/patients - Create new patient (Public for registration)
router.post(
  '/',
  validatePatient,
  patientController.createPatient
);
// POST /api/patients - Create new patient (Public for testing)
router.post('/', patientController.createPatient);


// GET /api/patients - Get all patients (Public for testing)  
router.get('/', patientController.getAllPatients);


// PUT /api/patients/:id - Update patient (Admin/Staff only)
router.put(
  '/:id',
  restrictTo('admin', 'doctor', 'staff'),
  validateId,
  validatePatient,
  patientController.updatePatient
);

// DELETE /api/patients/:id - Delete patient (Admin only)
router.delete(
  '/:id',
  restrictTo('admin'),
  validateId,
  patientController.deletePatient
);

// GET /api/patients/:id/dashboard - Get patient dashboard
router.get(
  '/:id/dashboard',
  validateId,
  patientController.getPatientDashboard
);

// GET /api/patients/:id/medical-history - Get patient medical history
router.get(
  '/:id/medical-history',
  validateId,
  patientController.getMedicalHistory
);

module.exports = router;