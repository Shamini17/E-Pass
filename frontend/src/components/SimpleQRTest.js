import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import QRCode from 'qrcode.react';

const SimpleQRTest = ({ open, onClose }) => {
  const [testValue, setTestValue] = useState('Hello World!');
  const [qrSize, setQrSize] = useState(200);
  const [showQR, setShowQR] = useState(false);

  const handleTestQR = () => {
    console.log('Testing QR code with value:', testValue);
    setShowQR(true);
  };

  const handleClose = () => {
    setShowQR(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">QR Code Test - Simple Rendering</Typography>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          This test verifies that QR code rendering works without backend dependencies.
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

        {showQR && (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              QR Code Display
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: 300,
              border: '3px solid #2196f3',
              borderRadius: 2,
              backgroundColor: '#f5f5f5',
              p: 3,
              mb: 2
            }}>
              {testValue ? (
                <Box>
                  <QRCode
                    value={testValue}
                    size={qrSize}
                    level="H"
                    includeMargin={true}
                    style={{
                      border: '2px solid #ccc',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      padding: '10px'
                    }}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    QR Code Generated Successfully!
                  </Typography>
                </Box>
              ) : (
                <Typography color="textSecondary">
                  Enter a value to generate QR code
                </Typography>
              )}
            </Box>
            
            {testValue && (
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <strong>Value:</strong> "{testValue}"
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Size:</strong> {qrSize}px | <strong>Type:</strong> String
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        <Alert severity="success" sx={{ mt: 2 }}>
          If you can see the QR code above, the qrcode.react library is working correctly!
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SimpleQRTest; 