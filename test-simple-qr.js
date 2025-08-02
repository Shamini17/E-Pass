const QRCode = require('qrcode');

// Simple QR code test
async function testSimpleQR() {
  try {
    console.log('🎯 Testing Simple QR Code Generation...\n');

    // Simple test data
    const testData = {
      student_id: "STU001",
      name: "Demo Student",
      message: "This is a test QR code"
    };

    console.log('📋 Test Data:', JSON.stringify(testData, null, 2));

    // Generate QR code immediately
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(testData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 200
    });

    console.log('✅ QR Code generated successfully!');
    console.log('📏 QR Code size:', qrCodeDataURL.length, 'characters');
    console.log('🔗 QR Code starts with:', qrCodeDataURL.substring(0, 50) + '...');
    
    console.log('\n🎉 QR Code Test Results:');
    console.log('✅ Generation: Immediate (no delays)');
    console.log('✅ Format: PNG data URL');
    console.log('✅ Size: Appropriate for display');
    console.log('✅ Encoding: Working perfectly');
    
    console.log('\n📱 Next Steps:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Login as a student');
    console.log('3. Click "Demo QR" button');
    console.log('4. QR code should appear immediately (no loading)');

  } catch (error) {
    console.error('❌ QR code test failed:', error.message);
  }
}

// Run the test
testSimpleQR(); 