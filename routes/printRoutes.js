// routes/printRoutes.js - COMPLETE VERSION WITH LAB TESTS
const express = require('express');
const router = express.Router();
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

// Import middleware
const { protect, restrictTo } = require('../middleware/auth');

// Apply protection to all print routes
router.use(protect);

// Thermal Printer Configuration
const getPrinterConfig = (customIP = null) => ({
  type: PrinterTypes.EPSON,
  interface: customIP ? `tcp://${customIP}:9100` : process.env.THERMAL_PRINTER_IP || 'tcp://192.168.1.100:9100',
  characterSet: 'TAMIL',
  removeSpecialCharacters: false,
  lineCharacter: '=',
  options: { timeout: 30000 }
});

// 📄 THERMAL PRINT BILL API (FOR REPORTS)
router.post('/thermal-print', restrictTo('admin', 'staff'), async (req, res) => {
  try {
    const { 
      billNumber, patient, doctor, reportType, items, 
      subtotal, tax, discount, total, paymentMode,
      printerIP 
    } = req.body;

    console.log('🖨️ Thermal print request:', billNumber);

    // Printer configuration
    const printerConfig = getPrinterConfig(printerIP);
    const printer = new ThermalPrinter(printerConfig);

    // Check printer connection
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return res.status(500).json({
        success: false,
        message: 'Thermal printer not connected. Check IP address and network.'
      });
    }

    // Generate thermal bill
    await generateThermalBill(printer, req.body);

    // Execute print
    await printer.execute();
    
    console.log(`✅ Thermal print successful: ${billNumber}`);

    res.json({
      success: true,
      message: 'Bill printed successfully on thermal printer',
      billNumber: billNumber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Thermal print error:', error);
    res.status(500).json({
      success: false,
      message: 'Print failed: ' + error.message
    });
  }
});

// 🧪 THERMAL PRINT FOR LAB TESTS API
router.post('/thermal-print-test', restrictTo('admin', 'staff'), async (req, res) => {
  try {
    const { 
      billNumber, patient, testName, testType, items, 
      subtotal, tax, discount, total, paymentMode,
      printerIP 
    } = req.body;

    console.log('🖨️ Thermal print for lab test:', billNumber);

    // Printer configuration
    const printerConfig = getPrinterConfig(printerIP);
    const printer = new ThermalPrinter(printerConfig);

    // Check printer connection
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return res.status(500).json({
        success: false,
        message: 'Thermal printer not connected. Check IP address and network.'
      });
    }

    // Generate thermal bill for lab test
    await generateLabTestBill(printer, req.body);

    // Execute print
    await printer.execute();
    
    console.log(`✅ Lab test bill printed: ${billNumber}`);

    res.json({
      success: true,
      message: 'Lab test bill printed successfully on thermal printer',
      billNumber: billNumber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Lab test print error:', error);
    res.status(500).json({
      success: false,
      message: 'Print failed: ' + error.message
    });
  }
});

// 🔧 PRINTER TEST ENDPOINT
router.post('/test-printer', restrictTo('admin'), async (req, res) => {
  try {
    const { printerIP } = req.body;
    const printerConfig = getPrinterConfig(printerIP);
    const printer = new ThermalPrinter(printerConfig);

    const isConnected = await printer.isPrinterConnected();
    
    if (isConnected) {
      // Print test page
      printer.alignCenter();
      printer.bold(true);
      printer.println('PRINTER TEST PAGE');
      printer.bold(false);
      printer.drawLine();
      printer.println('Hospital Management System');
      printer.println('Thermal Printer Test');
      printer.println(`Date: ${new Date().toLocaleString()}`);
      printer.drawLine();
      printer.cut();
      
      await printer.execute();
      
      res.json({
        success: true,
        message: 'Printer test successful - test page printed'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Printer not connected'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Printer test failed: ' + error.message
    });
  }
});

// 📊 PRINTER STATUS CHECK
router.get('/printer-status', restrictTo('admin', 'staff'), async (req, res) => {
  try {
    const printerConfig = getPrinterConfig();
    const printer = new ThermalPrinter(printerConfig);
    
    const isConnected = await printer.isPrinterConnected();
    
    res.json({
      success: true,
      printerStatus: isConnected ? 'connected' : 'disconnected',
      printerIP: process.env.THERMAL_PRINTER_IP || '192.168.1.100:9100',
      message: isConnected ? 'Printer is ready' : 'Printer not connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      printerStatus: 'error',
      message: error.message
    });
  }
});

// 🧾 THERMAL BILL GENERATION FUNCTION (FOR REPORTS)
async function generateThermalBill(printer, billData) {
  const { 
    billNumber, patient, doctor, reportType, 
    items, subtotal, tax, discount, total, paymentMode 
  } = billData;

  // Printer initialization
  printer.clear();
  printer.setCharacterSet('TAMIL');
  
  // 🏥 HEADER SECTION
  printer.alignCenter();
  printer.bold(true);
  printer.println('MEDICAL DIAGNOSTIC CENTER');
  printer.bold(false);
  printer.println('123 Hospital Road, Chennai - 600001');
  printer.println('Phone: 044-12345678 | GSTIN: 07AABCU9603R1ZM');
  printer.drawLine();
  
  // 📄 BILL INFO
  printer.alignLeft();
  printer.println(`Bill No   : ${billNumber}`);
  printer.println(`Date      : ${new Date().toLocaleDateString('en-IN')}`);
  printer.println(`Time      : ${new Date().toLocaleTimeString('en-IN')}`);
  printer.drawLine();
  
  // 👤 PATIENT INFORMATION
  printer.bold(true);
  printer.println('PATIENT DETAILS');
  printer.bold(false);
  printer.println(`Name      : ${patient}`);
  printer.drawLine();
  
  // 🩺 SERVICE INFORMATION
  printer.bold(true);
  printer.println('SERVICE DETAILS');
  printer.bold(false);
  printer.println(`Doctor    : Dr. ${doctor}`);
  printer.println(`Service   : ${reportType.toUpperCase()} REPORT`);
  printer.drawLine();
  
  // 💰 BILLING ITEMS
  printer.alignCenter();
  printer.bold(true);
  printer.println('BILLING DETAILS');
  printer.bold(false);
  printer.drawLine();
  
  // Table header
  printer.alignLeft();
  printer.bold(true);
  printer.println('DESCRIPTION            AMOUNT');
  printer.bold(false);
  printer.drawLine();
  
  // Bill items
  items.forEach((item) => {
    const desc = item.description.length > 20 ? 
      item.description.substring(0, 20) + '...' : item.description;
    printer.println(`${desc.padEnd(22)} ₹${item.amount}`);
  });
  
  printer.drawLine();
  
  // 💵 CALCULATIONS
  printer.println(`Subtotal:${' '.repeat(15)}₹${subtotal}`);
  printer.println(`Tax (${tax}%):${' '.repeat(12)}₹${(subtotal * tax / 100).toFixed(2)}`);
  printer.println(`Discount (${discount}%):${' '.repeat(6)}-₹${(subtotal * discount / 100).toFixed(2)}`);
  printer.drawLine();
  
  // 🎯 TOTAL AMOUNT
  printer.bold(true);
  printer.println(`TOTAL AMOUNT:${' '.repeat(9)}₹${total}`);
  printer.bold(false);
  printer.drawLine();
  
  // 💳 PAYMENT INFO
  printer.println(`Payment Mode: ${paymentMode.toUpperCase()}`);
  printer.println(`Status: PAID`);
  printer.drawLine();
  
  // 📝 FOOTER
  printer.alignCenter();
  printer.println('Thank you for your visit!');
  printer.println('Please bring this bill for follow-up');
  printer.println('');
  printer.println('** Computer generated bill **');
  printer.println('** No signature required **');
  printer.println('');
  
  // Paper cut
  printer.cut();
}

// 🧫 LAB TEST BILL GENERATION FUNCTION
async function generateLabTestBill(printer, billData) {
  const { 
    billNumber, patient, testName, testType, items, total 
  } = billData;

  // Printer initialization
  printer.clear();
  printer.setCharacterSet('TAMIL');
  
  // 🏥 HEADER SECTION
  printer.alignCenter();
  printer.bold(true);
  printer.println('ADVANCED LABORATORY');
  printer.bold(false);
  printer.println('38CW+36Q, Tenkasi Madurai Rd');
  printer.println('Kadaiyanallur | Phone: +91 6381095854');
  printer.drawLine();
  
  // 📄 BILL INFO
  printer.alignLeft();
  printer.println(`Bill No   : ${billNumber}`);
  printer.println(`Date      : ${new Date().toLocaleDateString('en-IN')}`);
  printer.println(`Time      : ${new Date().toLocaleTimeString('en-IN')}`);
  printer.drawLine();
  
  // 👤 PATIENT INFORMATION
  printer.bold(true);
  printer.println('PATIENT DETAILS');
  printer.bold(false);
  printer.println(`Name      : ${patient}`);
  printer.println(`Test      : ${testName}`);
  printer.println(`Type      : ${testType}`);
  printer.drawLine();
  
  // 💰 LAB SERVICES
  printer.alignCenter();
  printer.bold(true);
  printer.println('LABORATORY SERVICES');
  printer.bold(false);
  printer.drawLine();
  
  // Table header
  printer.alignLeft();
  printer.bold(true);
  printer.println('SERVICE               AMOUNT');
  printer.bold(false);
  printer.drawLine();
  
  // Services
  items.forEach((item, index) => {
    const desc = item.name.length > 18 ? 
      item.name.substring(0, 18) + '...' : item.name;
    printer.println(`${desc.padEnd(21)} ₹${item.price}`);
  });
  
  printer.drawLine();
  
  // 🎯 TOTAL AMOUNT
  printer.bold(true);
  printer.println(`TOTAL AMOUNT:${' '.repeat(8)}₹${total}`);
  printer.bold(false);
  printer.drawLine();
  
  // 📝 FOOTER
  printer.alignCenter();
  printer.println('Thank you for your visit!');
  printer.println('Report available in 24-48 hours');
  printer.println('');
  printer.println('** Lab Test Bill **');
  printer.println('');
  
  // Paper cut
  printer.cut();
}

module.exports = router;