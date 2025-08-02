const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test QR code generation
async function testQRGeneration() {
  try {
    console.log('🔍 Testing QR Code Generation...\n');

    // 1. Test QR generation endpoint (should require auth)
    console.log('1. Testing QR Generation Endpoint (without auth):');
    try {
      const response = await axios.post(`${API_BASE_URL}/students/qr/generate`);
      console.log('✅ QR Generation Response:', response.data);
    } catch (error) {
      console.log('❌ Expected Error (no auth):', error.response?.data?.error);
    }

    // 2. Test QR status endpoint (should require auth)
    console.log('\n2. Testing QR Status Endpoint (without auth):');
    try {
      const response = await axios.get(`${API_BASE_URL}/students/qr/status`);
      console.log('✅ QR Status Response:', response.data);
    } catch (error) {
      console.log('❌ Expected Error (no auth):', error.response?.data?.error);
    }

    // 3. Test with a mock token (should fail but show different error)
    console.log('\n3. Testing QR Generation with mock token:');
    try {
      const response = await axios.post(`${API_BASE_URL}/students/qr/generate`, {}, {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      console.log('✅ QR Generation Response:', response.data);
    } catch (error) {
      console.log('❌ Error with mock token:', error.response?.data?.error);
    }

    console.log('\n🔍 QR Code Generation Debug Info:');
    console.log('• Backend is running on port 5000');
    console.log('• QR endpoints are protected with authentication');
    console.log('• Students need an active outpass to generate QR codes');
    console.log('• QR codes expire after 5 minutes');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testQRGeneration(); 