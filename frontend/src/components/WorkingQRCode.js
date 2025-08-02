import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import { QrCode as QrCodeIcon } from '@mui/icons-material';
import QRCode from 'qrcode.react';

const WorkingQRCode = ({ open, onClose }) => {
  const [testValue] = useState('Hello World! This is a test QR code.');

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <QrCodeIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Working QR Code Test</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="success" sx={{ mb: 3 }}>
          This is a simple QR code test to verify the library is working correctly.
        </Alert>

        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            textAlign: 'center', 
            mb: 2,
            border: '3px solid #2196f3',
            backgroundColor: '#f5f5f5'
          }}
        >
          <Typography variant="h6" gutterBottom>
            QR Code Display
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: 250,
            padding: 2
          }}>
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
          </Box>
          
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            <strong>Value:</strong> "{testValue}"
          </Typography>
          
          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
            ✅ QR Code Generated Successfully!
          </Typography>
        </Paper>

        <Alert severity="info">
          If you can see the QR code above, the qrcode.react library is working correctly.
          If you cannot see it, there may be a CSS or rendering issue.
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkingQRCode; 