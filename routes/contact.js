const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact'); // Make sure this path is correct
const nodemailer = require('nodemailer');

// Test route to check if contact API is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Contact API is working!',
    timestamp: new Date().toISOString()
  });
});


// Add this route to your existing contact.js file
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: contact
    });
  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });  
  }
});

// ✅ ADD THIS DELETE ROUTE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if message exists
    const message = await Contact.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Delete the message
    await Contact.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Contact message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message: ' + error.message
    });
  }
});
// Contact form - Save to DB + Send Email + Send SMS
router.post('/send', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validation
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    console.log('📝 Contact form received:', { name, email, phone, subject });

    // 1. MongoDB-la Save Pannu
    const newContact = new Contact({
      name,
      email,
      phone,
      subject,
      message
    });

    await newContact.save();
    console.log('✅ Contact saved to MongoDB with ID:', newContact._id);

    // 2. Email Anupnu
    let emailSent = false;
    let emailError = null;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        console.log('📧 Attempting to send email...');
        
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        // Verify connection first
        await transporter.verify();
        console.log('✅ Email server connected');

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: 'nagarajan16052001@gmail.com', // Your email
          subject: `🏥 New Contact: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">🏥 New Contact Form Submission</h2>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                <p><strong>👤 Name:</strong> ${name}</p>
                <p><strong>📧 Email:</strong> ${email}</p>
                <p><strong>📞 Phone:</strong> ${phone}</p>
                <p><strong>📋 Subject:</strong> ${subject}</p>
                <p><strong>💬 Message:</strong></p>
                <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb;">
                  ${message}
                </div>
                <p><strong>⏰ Received:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
        console.log('✅ Email sent successfully to nagarajan16052001@gmail.com');

      } catch (emailErr) {
        emailError = emailErr.message;
        console.log('❌ Email failed:', emailErr.message);
      }
    } else {
      console.log('📧 Email not configured - check EMAIL_USER and EMAIL_PASS in .env');
    }

    // 3. Mobile-ku SMS Anupnu
    let smsSent = false;
    try {
      await sendSMS(phone, name, subject);
      smsSent = true;
      console.log('📱 SMS sent successfully');
    } catch (smsError) {
      console.log('📱 SMS failed:', smsError.message);
    }

    res.json({
      success: true,
      message: '✅ Thank you! Your message has been received. We will contact you soon.',
      data: {
        id: newContact._id,
        savedToDB: true,
        emailSent: emailSent,
        smsSent: smsSent,
        emailError: emailError
      }
    });

  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Simple SMS Function
async function sendSMS(phone, name, subject) {
  console.log('='.repeat(50));
  console.log('📱 SMS NOTIFICATION');
  console.log('='.repeat(50));
  console.log('To:', phone);
  console.log('Message:', `Hi ${name}, Thank you for contacting Healthcare! We received your query: "${subject}". We will get back to you within 24 hours. - Healthcare Team`);
  console.log('='.repeat(50));
  
  // Future: Actual SMS service integrate pannalam
  return true;
}

// Get all contacts (Admin use pannalam)
router.get('/all', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts'
    });
  }
});

// Get contact by ID
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('❌ Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact'
    });
  }
});

module.exports = router;