// server.js - COMPLETE FIXED VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ==================== CORS CONFIGURATION ====================
// ✅ FIX 1: Correct CORS settings
const allowedOrigins = [
  'https://advanced-lab-diagnostic.vercel.app', // Your main website
  'https://med-q-admin.vercel.app',             // Your admin panel
  'http://localhost:3000',                      // Local development
  'http://localhost:3001'                       // Alternative local port
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      console.log('❌ CORS Blocked:', origin);
      return callback(new Error(msg), false);
    }
    
    console.log('✅ CORS Allowed:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'x-auth-token',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'Authorization', 'x-auth-token'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

// ✅ FIX 2: Add CORS headers manually (extra safety)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nagarajan16052001:NAGARAJAN2001@cluster0.jxnj3.mongodb.net/advanced_lab1', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

connectDB();

// ==================== ROUTES ====================
// Admin routes
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');

// User routes
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

// Apply routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/auth', authRoutes);
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

// ==================== SPECIAL ENDPOINTS ====================
// Quick admin login (if separate route needed)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔄 Admin login attempt:', email);
    
    // For testing - allow all domains
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
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

// ==================== HEALTH & INFO ROUTES ====================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    allowedOrigins: allowedOrigins,
    corsEnabled: true
  });
});

app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    yourOrigin: req.headers.origin,
    allowed: allowedOrigins.includes(req.headers.origin),
    timestamp: new Date().toISOString()
  });
});

// Default API info route
app.get('/', (req, res) => {
  res.json({ 
    message: '🏥 Hospital Management System API v2.0', 
    version: '2.0.0',
    adminLogin: 'POST /api/admin/login',
    userLogin: 'POST /api/auth/login',
    userRegister: 'POST /api/auth/register',
    frontendURL: 'https://advanced-lab-diagnostic.vercel.app',
    adminURL: 'https://med-q-admin.vercel.app',
    endpoints: {
      adminAuth: '/api/admin/auth',
      auth: '/api/auth',
      admin: '/api/admin',
      dashboard: '/api/admin/dashboard',
      patients: '/api/patients',
      appointments: '/api/appointments',
      tests: '/api/tests',
      staff: '/api/staff',
      reports: '/api/reports',
      contact: '/api/contact',
      profile: '/api/profile',
      settings: '/api/settings'
    },
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins
    }
  });
});

// ==================== ERROR HANDLING ====================
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API route not found',
    requestedUrl: req.originalUrl,
    availableEndpoints: ['/api/auth/login', '/api/auth/register', '/api/admin/login']
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Server Error:', error);
  
  // Add CORS headers even on errors
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Contact administrator'
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Backend URL: https://med-q-diagnostics-backend-1.onrender.com`);
  console.log(`🔗 Frontend URL: https://advanced-lab-diagnostic.vercel.app`);
  console.log(`🔗 Admin Panel: https://med-q-admin.vercel.app`);
  console.log(`👤 User Login: POST /api/auth/login`);
  console.log(`👤 User Register: POST /api/auth/register`);
  console.log(`🔑 Admin Login: POST /api/admin/login`);
  console.log(`❤️  Health Check: /api/health`);
  console.log(`✅ CORS Enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`=========================================`);
});