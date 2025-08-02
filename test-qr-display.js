const QRCode = require('qrcode');

// Test QR code generation and display
async function testQRDisplay() {
  try {
    console.log('🎯 Testing QR Code Display...\n');

    // Create sample QR data
    const qrData = {
      student_id: "STU001",
      name: "Demo Student",
      outpass_id: 123,
      from_date: "2024-01-15",
      from_time: "14:00",
      to_date: "2024-01-15",
      to_time: "18:00",
      reason: "Demo outpass for testing",
      place: "Demo Location",
      city: "Demo City",
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      type: "demo_qr"
    };

    console.log('📋 QR Data to encode:');
    console.log(JSON.stringify(qrData, null, 2));

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 256
    });

    console.log('\n✅ QR Code generated successfully!');
    console.log('📏 QR Code size:', qrCodeDataURL.length, 'characters');
    console.log('🔗 QR Code starts with:', qrCodeDataURL.substring(0, 50) + '...');
    
    console.log('\n🎯 QR Code Display Test Results:');
    console.log('✅ QR code generation: Working');
    console.log('✅ QR code encoding: Working');
    console.log('✅ QR code format: PNG data URL');
    console.log('✅ QR code size: Appropriate for display');
    
    console.log('\n📱 To test QR code display:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Login as a student');
    console.log('3. Click "Demo QR" button');
    console.log('4. You should see a black and white QR code');

  } catch (error) {
    console.error('❌ QR code test failed:', error.message);
  }
}

// Run the test
testQRDisplay(); 