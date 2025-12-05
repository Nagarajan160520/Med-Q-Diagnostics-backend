// middleware/validation.js - Input validation middleware
const { body, param, query } = require('express-validator');

// Patient validation rules
exports.validatePatient = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('age')
    .isInt({ min: 0, max: 120 })
    .withMessage('Age must be between 0 and 120'),
  
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  
  body('address.street')
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage('Street address must be at least 5 characters long'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('City must be at least 2 characters long'),
  
  body('bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group')
];

// Appointment validation rules
exports.validateAppointment = [
  body('patient')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  
  body('doctor')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  
  body('appointmentDate')
    .isISO8601()
    .withMessage('Invalid appointment date')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  
  body('appointmentTime')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Appointment time is required'),
  
  body('reason')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Reason must be at least 10 characters long')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  body('type')
    .optional()
    .isIn(['consultation', 'follow-up', 'checkup', 'emergency', 'surgery'])
    .withMessage('Invalid appointment type'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage('Duration must be between 15 and 240 minutes')
];

// Test validation rules
exports.validateTest = [
  body('patient')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  
  body('testName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Test name must be at least 2 characters long'),
  
  body('testType')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Test type must be at least 2 characters long'),
  
  body('description')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  
  body('scheduledDate')
    .isISO8601()
    .withMessage('Invalid scheduled date'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('technician')
    .optional()
    .isMongoId()
    .withMessage('Invalid technician ID')
];

// Staff validation rules
exports.validateStaff = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('role')
    .isIn(['doctor', 'nurse', 'technician', 'receptionist', 'admin', 'pharmacist'])
    .withMessage('Invalid staff role'),
  
  body('department')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Department must be at least 2 characters long'),
  
  body('specialization')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Specialization must be at least 2 characters long'),
  
  body('experience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Experience must be a positive number'),
  
  body('salary')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a positive number')
];

// Report validation rules
exports.validateReport = [
  body('patient')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  
  body('doctor')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  
  body('reportType')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Report type must be at least 2 characters long'),
  
  body('findings')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Findings must be at least 10 characters long'),
  
  body('diagnosis')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Diagnosis must be at least 5 characters long'),
  
  body('prescription')
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage('Prescription must be at least 5 characters long'),
  
  body('isCritical')
    .optional()
    .isBoolean()
    .withMessage('isCritical must be a boolean value')
];

// Query parameter validation
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// ID parameter validation
exports.validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Search query validation
exports.validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters long')
];

// Date range validation
exports.validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        
        if (endDate < startDate) {
          throw new Error('End date cannot be before start date');
        }
      }
      return true;
    })
];