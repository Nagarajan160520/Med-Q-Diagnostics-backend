// server.js - Fixed version
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
    
    // Verify Contact model
    const Contact = require('./models/Contact');
    console.log('✅ Contact model loaded');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const testRoutes = require('./routes/tests');
const staffRoutes = require('./routes/staff');
const reportRoutes = require('./routes/reports');
const contactRoutes = require('./routes/contact'); 
const printRoutes = require('./routes/printRoutes'); // Add this line
const referralRoutes = require('./routes/referrals');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin/appointments', appointmentRoutes); // Admin access kooda
app.use('/api/tests', testRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/contact', contactRoutes); 
app.use('/api/print', printRoutes); // Add this line for thermal printing
app.use('/api/referrals', referralRoutes);
app.use('/api/profile', profileRoutes); 
app.use('/api/settings', settingsRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: '🏥 Hospital Management System API', 
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      patients: '/api/patients',
      appointments: '/api/appointments',
      tests: '/api/tests',
      staff: '/api/staff',
      reports: '/api/reports',
      contact: '/api/contact',
       profile: '/api/profile',
       settings: '/api/settings'
    }
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running healthy',
    timestamp: new Date().toISOString()
  });
}); 

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/api/admin`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`); // Fix: localhost
  console.log(`🏥 MongoDB: Connected to ${process.env.MONGODB_URI}`);
  console.log(`👤 Profile API: http://localhost:${PORT}/api/profile`);
   console.log(`⚙️ Settings API: http://localhost:${PORT}/api/settings`);
});  