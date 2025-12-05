// utils/emailTemplate.js - Email template generator
exports.generateWelcomeTemplate = (user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f8fafc; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to MediCare Hospital! 🏥</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${user.name},</h2>
          <p>Your account has been successfully created with the following details:</p>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Account Created:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p>You can now access our patient portal to:</p>
          <ul>
            <li>Book appointments with doctors</li>
            <li>View your medical reports</li>
            <li>Check test results</li>
            <li>Manage your health profile</li>
          </ul>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.CLIENT_URL}/login" class="button">Login to Your Account</a>
          </div>
          
          <p><strong>Need help?</strong> Contact our support team at support@medicare.com or call +91-9876543210.</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MediCare Hospital. All rights reserved.</p>
          <p>123 Healthcare Street, Medical City, MC 123456</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.generateAppointmentTemplate = (appointment, patient, doctor) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background: #f8fafc; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .appointment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Confirmed! ✅</h1>
        </div>
        
        <div class="content">
          <h2>Dear ${patient.name},</h2>
          <p>Your appointment has been successfully scheduled. Here are the details:</p>
          
          <div class="appointment-details">
            <h3>Appointment Details</h3>
            <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
            <p><strong>Specialization:</strong> ${doctor.specialization}</p>
            <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString('en-IN')}</p>
            <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
            <p><strong>Appointment ID:</strong> ${appointment._id.toString().slice(-8).toUpperCase()}</p>
            <p><strong>Reason:</strong> ${appointment.reason}</p>
          </div>
          
          <h3>Important Instructions:</h3>
          <ul>
            <li>Please arrive 15 minutes before your scheduled time</li>
            <li>Bring your ID proof and previous medical reports (if any)</li>
            <li>Carry your insurance card if applicable</li>
            <li>Wear a mask and follow COVID-19 safety protocols</li>
          </ul>
          
          <p><strong>Need to reschedule?</strong> Please call us at +91-9876543210 at least 2 hours before your appointment.</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MediCare Hospital. All rights reserved.</p>
          <p>We look forward to serving you!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.generateTestResultsTemplate = (test, patient) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
        .content { background: #f8fafc; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .test-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Test Results Available 🔬</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${patient.name},</h2>
          <p>Your test results are now available in the patient portal.</p>
          
          <div class="test-details">
            <h3>Test Information</h3>
            <p><strong>Test Name:</strong> ${test.testName}</p>
            <p><strong>Test Type:</strong> ${test.testType}</p>
            <p><strong>Test Date:</strong> ${new Date(test.scheduledDate).toLocaleDateString('en-IN')}</p>
            <p><strong>Status:</strong> ${test.status}</p>
            ${test.results ? `<p><strong>Results:</strong> Available in portal</p>` : ''}
          </div>
          
          <p>To view your complete test results and download the report:</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.CLIENT_URL}/patient-portal" class="button">View Test Results</a>
          </div>
          
          <p><strong>Note:</strong> Please consult with your doctor to understand the test results and get proper medical advice.</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MediCare Hospital. All rights reserved.</p>
          <p>For any queries, contact our lab: +91-9876543211</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.generatePasswordResetTemplate = (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { background: #f8fafc; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        
        <div class="content">
          <h2>Hello ${user.name},</h2>
          <p>We received a request to reset your password for your MediCare Hospital account.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" class="button">Reset Your Password</a>
          </div>
          
          <p>This password reset link will expire in 10 minutes.</p>
          
          <p><strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your account remains secure.</p>
          
          <p><strong>Need help?</strong> Contact our support team immediately if you have any concerns.</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} MediCare Hospital. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};