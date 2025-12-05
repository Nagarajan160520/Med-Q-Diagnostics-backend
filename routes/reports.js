const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// GET /api/reports - Get all reports
router.get('/', restrictTo('admin', 'doctor', 'staff'), reportController.getAllReports);

// GET /api/reports/:id - Get single report
router.get('/:id', reportController.getReport);

// POST /api/reports - Create new report
router.post('/', restrictTo('admin', 'doctor'), reportController.createReport);

// PUT /api/reports/:id - Update report
router.put('/:id', reportController.updateReport);

// DELETE /api/reports/:id - Delete report (Admin only)
router.delete('/:id', restrictTo('admin'), reportController.deleteReport);

// GET /api/reports/patient/:patientName - Get reports by patient
router.get('/patient/:patientName', reportController.getReportsByPatient);

// GET /api/reports/doctor/:doctorName - Get reports by doctor
router.get('/doctor/:doctorName', reportController.getReportsByDoctor);

// GET /api/reports/critical - Get critical reports
router.get('/critical', restrictTo('admin', 'doctor'), reportController.getCriticalReports);

module.exports = router;