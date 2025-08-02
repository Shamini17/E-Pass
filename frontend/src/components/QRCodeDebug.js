import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { QrCode as QrCodeIcon } from '@mui/icons-material';
import QRCode from 'qrcode.react';

const QRCodeDebug = ({ open, onClose }) => {
  const [step, setStep] = useState(1);
  const [testValue, setTestValue] = useState('Test QR Code');
  const [qrVisible, setQrVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setQrVisible(false);
    }
  }, [open]);

  const runTest = () => {
    console.log('🧪 Starting QR Code Debug Test...');
    console.log('Step 1: Testing QRCode import');
    console.log('QRCode type:', typeof QRCode);
    
    setStep(2);
    setTimeout(() => {
      console.log('Step 2: Testing QR code generation');
      setQrVisible(true);
      setStep(3);
    }, 1000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 1: Library Check
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Checking if qrcode.react library is loaded correctly...
            </Alert>
            <Button variant="contained" onClick={runTest}>
              Start Test
            </Button>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 2: Generating QR Code
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Generating QR code with value: "{testValue}"
            </Alert>
            <Box sx={{ textAlign: 'center' }}>
              <Typography>Loading...</Typography>
            </Box>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 3: QR Code Display
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              QR code should be visible below
            </Alert>
            
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                border: '3px solid #2196f3',
                backgroundColor: '#f5f5f5'
              }}
            >
              {qrVisible && (
                <Box>
                  <QRCode
                    value={testValue}
                    size={200}
                    level="H"
                    includeMargin={true}
                    style={{
                      border: '2px solid #ccc',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      padding: '10px'
                    }}
                  />
                  <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
                    ✅ QR Code Generated Successfully!
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Value: "{testValue}"
                  </Typography>
                </Box>
              )}
            </Paper>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              If you can see the QR code above, the library is working correctly.
              If not, check the browser console for errors.
            </Alert>
          </Box>
        );
      
      default:
        return <Typography>Test complete</Typography>;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <QrCodeIcon sx={{ mr: 1 }} />
          <Typography variant="h6">QR Code Debug Test</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {renderStep()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeDebug; 