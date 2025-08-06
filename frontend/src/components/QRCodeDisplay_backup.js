import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { QrCode as QrCodeIcon, Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import QRCode from 'qrcode.react';
import { studentAPI } from '../services/api';
import { toast } from 'react-toastify';

const QRCodeDisplay = ({ outpassId, outpassData, open, onClose }) => {
  const [outpass, setOutpass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (outpassData) {
        // Use provided outpass data
        setOutpass(outpassData);
        setLoading(false);
        setError('');
      } else if (outpassId) {
        // Fetch outpass details if only ID is provided
        fetchOutpassDetails();
      }
    }
  }, [open, outpassId, outpassData]);

  const fetchOutpassDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await studentAPI.getOutpassDetails(outpassId);
      setOutpass(response.data.outpass);
    } catch (error) {
      setError('Failed to load outpass details');
      toast.error('Failed to load outpass details');
    } finally {
      setLoading(false);
    }
  };

  const generateQRData = () => {
    if (outpass?.qr_code && outpass.qr_code.startsWith('data:image')) {
      return JSON.stringify({
        outpass_id: outpass.id,
        student_id: outpass.student_id,
        student_name: outpass.student_name,
        from_date: outpass.from_date,
        to_date: outpass.to_date,
        status: outpass.status,
        timestamp: new Date().toISOString()
      });
    }
    
    if (outpass?.qr_code && outpass.qr_code.length < 1000) {
      return outpass.qr_code;
    }
    
    return JSON.stringify({
      outpass_id: outpass?.id || 'unknown',
      student_id: outpass?.student_id || 'unknown',
      student_name: outpass?.student_name || 'unknown',
      from_date: outpass?.from_date || 'unknown',
      to_date: outpass?.to_date || 'unknown',
      status: outpass?.status || 'unknown',
      timestamp: new Date().toISOString()
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <QrCodeIcon sx={{ mr: 1 }} />
          Outpass QR Code
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : outpass ? (
          <Box>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Box>
                <QRCode
                  value={generateQRData()}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                
                {outpass.qr_code && outpass.qr_code.startsWith('data:image') && (
                  <Box sx={{ mt: 2 }}>
                    <img 
                      src={outpass.qr_code} 
                      alt="QR Code Image" 
                      style={{ 
                        width: '200px', 
                        height: '200px',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }} 
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                      Original QR Code Image
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  {outpass.student_name}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>From:</strong> {outpass.from_date} {outpass.from_time}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>To:</strong> {outpass.to_date} {outpass.to_time}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Reason:</strong> {outpass.reason}
                </Typography>
                
                {outpass.qr_expires_at && (
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Valid Until:</strong> {outpass.qr_expires_at}
                  </Typography>
                )}
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  Show this QR code to the security guard when leaving and returning to the hostel.
                </Alert>
              </Box>
            </Paper>
          </Box>
        ) : (
          <Alert severity="info">No outpass data available.</Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeDisplay;
