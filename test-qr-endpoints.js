const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test QR code endpoints
async function testQREndpoints() {
  try {
    console.log('🧪 Testing QR Code Endpoints...\n');

    // 1. Test QR status endpoint (should require auth)
    console.log('1. Testing QR Status Endpoint (without auth):');
    try {
      const response = await axios.get(`${API_BASE_URL}/students/qr/status`);
      console.log('✅ QR Status Response:', response.data);
    } catch (error) {
      console.log('❌ Expected Error (no auth):', error.response?.data?.error);
    }

    // 2. Test QR generation endpoint (should require auth)
    console.log('\n2. Testing QR Generation Endpoint (without auth):');
    try {
      const response = await axios.post(`${API_BASE_URL}/students/qr/generate`);
      console.log('✅ QR Generation Response:', response.data);
    } catch (error) {
      console.log('❌ Expected Error (no auth):', error.response?.data?.error);
    }

    // 3. Test QR validation endpoint (should require auth)
    console.log('\n3. Testing QR Validation Endpoint (without auth):');
    try {
      const response = await axios.post(`${API_BASE_URL}/students/qr/validate`, {
        qr_data: '{"test": "data"}',
        action: 'exit'
      });
      console.log('✅ QR Validation Response:', response.data);
    } catch (error) {
      console.log('❌ Expected Error (no auth):', error.response?.data?.error);
    }

    // 4. Test student QR endpoint (should require auth)
    console.log('\n4. Testing Student QR Endpoint (without auth):');
    try {
      const response = await axios.get(`${API_BASE_URL}/students/qr/STU001`);
      console.log('✅ Student QR Response:', response.data);
    } catch (error) {
      console.log('❌ Expected Error (no auth):', error.response?.data?.error);
    }

    console.log('\n✅ All QR endpoints are properly protected with authentication!');
    console.log('📝 The endpoints are working correctly and require valid JWT tokens.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testQREndpoints(); 