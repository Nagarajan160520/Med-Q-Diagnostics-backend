// routes/admin.js - Fixed version
const express = require('express');
const router = express.Router();

// Import controllers and middleware
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);
router.use(restrictTo('admin'));

// Dashboard routes
router.get('/dashboard', adminController.getDashboardStats);
router.get('/recent-activities', adminController.getRecentActivities);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Patient management
router.get('/patients', adminController.getAllPatients);
router.get('/patients/:id', adminController.getPatient);
router.put('/patients/:id', adminController.updatePatient);
router.delete('/patients/:id', adminController.deletePatient);

// Staff management
router.get('/staff', adminController.getAllStaff);
router.post('/staff', adminController.createStaff);
router.put('/staff/:id', adminController.updateStaff);
router.delete('/staff/:id', adminController.deleteStaff);

// Appointment management
router.get('/appointments', adminController.getAllAppointments);
router.post('/appointments', adminController.createAppointment);
router.put('/appointments/:id', adminController.updateAppointment);
router.delete('/appointments/:id', adminController.deleteAppointment);

// Test management
router.get('/tests', adminController.getAllTests);
router.post('/tests', adminController.createTest);
router.put('/tests/:id', adminController.updateTest);
router.delete('/tests/:id', adminController.deleteTest);

// Report management
router.get('/reports', adminController.getAllReports);
router.post('/reports', adminController.createReport);
router.put('/reports/:id', adminController.updateReport);
router.delete('/reports/:id', adminController.deleteReport);

// Analytics
router.get('/analytics/patients-monthly', adminController.getMonthlyPatientStats);
router.get('/analytics/revenue', adminController.getRevenueStats);

module.exports = router;