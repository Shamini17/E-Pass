import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Alert
} from '@mui/material';
import QRCode from 'qrcode.react';

const QRCodeTest = () => {
  const [testValue, setTestValue] = useState('Hello World!');
  const [qrSize, setQrSize] = useState(200);

  const handleTestQR = () => {
    console.log('Testing QR code with value:', testValue);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        QR Code Test Component
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This component tests if QR code rendering is working correctly.
      </Alert>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Controls
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="QR Code Value"
            value={testValue}
            onChange={(e) => setTestValue(e.target.value)}
            helperText="Enter text to encode in QR code"
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            type="number"
            label="QR Code Size"
            value={qrSize}
            onChange={(e) => setQrSize(Number(e.target.value))}
            helperText="Size in pixels"
            sx={{ width: 200 }}
          />
        </Box>
        
        <Button 
          variant="contained" 
          onClick={handleTestQR}
          sx={{ mb: 2 }}
        >
          Test QR Code
        </Button>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          QR Code Display
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 300,
          border: '2px solid #e0e0e0',
          borderRadius: 2,
          backgroundColor: '#fafafa',
          p: 2
        }}>
          {testValue ? (
            <QRCode
              value={testValue}
              size={qrSize}
              level="H"
              includeMargin={true}
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}
            />
          ) : (
            <Typography color="textSecondary">
              Enter a value to generate QR code
            </Typography>
          )}
        </Box>
        
        {testValue && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Value: "{testValue}" | Size: {qrSize}px
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default QRCodeTest; 