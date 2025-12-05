// routes/tests.js - Complete fixed version
const express = require('express');
const router = express.Router();

// Import controllers and middleware
const testController = require('../controllers/testController');
const { protect } = require('../middleware/auth');
const { 
  validateTest, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');

// Apply protection to all routes
router.use(protect);

// GET /api/tests - Get all tests
router.get(
  '/',
  validatePagination,
  testController.getAllTests
);

// GET /api/tests/:id - Get single test
router.get(
  '/:id',
  validateId,
  testController.getTest
); 

// POST /api/tests - Create new test
router.post(
  '/',
  validateTest,
  testController.createTest
);

// PUT /api/tests/:id - Update test
router.put(
  '/:id',
  validateId,
  testController.updateTest
);

// DELETE /api/tests/:id - Delete test
router.delete(
  '/:id',
  validateId,
  testController.deleteTest
);

// GET /api/tests/patient/:patientId - Get tests by patient
router.get(
  '/patient/:patientId',
  validateId,
  validatePagination,
  testController.getTestsByPatient
);

// PUT /api/tests/:id/results - Update test results
router.put(
  '/:id/results',
  validateId,
  testController.updateTestResults
);

// GET /api/tests/pending - Get pending tests
router.get(
  '/pending',
  testController.getPendingTests
);

module.exports = router;