// config/email.js - Email configuration
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send welcome email
exports.sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Welcome to MediCare Hospital 🏥',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to MediCare Hospital!</h2>
          <p>Dear ${user.name},</p>
          <p>Your account has been successfully created with the following details:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
          </div>
          <p>You can now login to our patient portal and book appointments.</p>
          <p>Best regards,<br>MediCare Hospital Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

// Send appointment confirmation
exports.sendAppointmentConfirmation = async (appointment, patient, doctor) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patient.email,
      subject: 'Appointment Confirmation - MediCare Hospital',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Appointment Confirmed! 🎉</h2>
          <p>Dear ${patient.name},</p>
          <p>Your appointment has been successfully scheduled.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Doctor:</strong> Dr. ${doctor.name}</p>
            <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
            <p><strong>Reason:</strong> ${appointment.reason}</p>
          </div>
          <p>Please arrive 15 minutes before your scheduled time.</p>
          <p>Best regards,<br>MediCare Hospital Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Appointment confirmation sent to:', patient.email);
  } catch (error) {
    console.error('Error sending appointment confirmation:', error);
  }
};

// Send test results notification
exports.sendTestResultsNotification = async (test, patient) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patient.email,
      subject: 'Test Results Available - MediCare Hospital',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Test Results Available 🔬</h2>
          <p>Dear ${patient.name},</p>
          <p>Your test results are now available in the patient portal.</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Test Name:</strong> ${test.testName}</p>
            <p><strong>Test Type:</strong> ${test.testType}</p>
            <p><strong>Date:</strong> ${new Date(test.scheduledDate).toLocaleDateString()}</p>
          </div>
          <p>Please login to your patient portal to view the complete results.</p>
          <p>Best regards,<br>MediCare Hospital Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Test results notification sent to:', patient.email);
  } catch (error) {
    console.error('Error sending test results notification:', error);
  }
};