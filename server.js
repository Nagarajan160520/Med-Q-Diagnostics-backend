// server.js - COMPLETE FIXED VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin:  'https://med-q-diagnostics-frontend-1.onrender.com',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nagarajan16052001:NAGARAJAN2001@cluster0.jxnj3.mongodb.net/advanced_lab1', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

connectDB();

// ✅ ADD THIS: Admin-specific routes FIRST
const adminAuthRoutes = require('./routes/adminAuth'); // New file for admin login
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const testRoutes = require('./routes/tests');
const staffRoutes = require('./routes/staff');
const reportRoutes = require('./routes/reports');
const contactRoutes = require('./routes/contact');
const printRoutes = require('./routes/printRoutes');
const referralRoutes = require('./routes/referrals');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');

// ✅ ROUTES ORDER MATTERS!
app.use('/api/admin/auth', adminAuthRoutes); // Admin login separate
app.use('/api/auth', authRoutes); // Normal user auth
app.use('/api/admin', adminRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/print', printRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);

// ✅ Add specific admin login endpoint (quick fix)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔄 Admin login attempt:', email);
    
    // Admin email check
    if (!email.endsWith('@gmail.com')) {
      return res.status(400).json({
        success: false,
        message: 'Only Gmail addresses allowed for admin login'
      });
    }
    
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    
    if (!user) {
      console.log('❌ Admin user not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Admin login successful:', user.name);
    
    res.json({
      success: true,
      token,
      message: 'Admin login successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          department: user.department,
          specialization: user.specialization
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: '🏥 Hospital Management System API v2.0', 
    version: '2.0.0',
    adminLogin: 'POST /api/admin/login',
    endpoints: {
      adminAuth: '/api/admin/auth',
      auth: '/api/auth',
      admin: '/api/admin',
      dashboard: '/api/admin/dashboard',
      patients: '/api/patients',
      appointments: '/api/appointments',
      tests: '/api/tests',
      staff: '/api/staff',
      reports: '/api/reports'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API route not found',
    requestedUrl: req.originalUrl
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Contact administrator'
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Admin Login: http://localhost:${PORT}/api/admin/login`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/api/admin/dashboard`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🏥 MongoDB: Connected to ${process.env.MONGODB_URI}`);
  console.log(`👤 Profile API: http://localhost:${PORT}/api/profile`);
  console.log(`⚙️ Settings API: http://localhost:${PORT}/api/settings`);
});