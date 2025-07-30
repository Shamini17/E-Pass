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

const QRCodeDisplay = ({ outpassId, open, onClose }) => {
  const [outpass, setOutpass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && outpassId) {
      fetchOutpassDetails();
    }
  }, [open, outpassId]);

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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>E-Pass QR Code</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .qr-container { margin: 20px 0; }
            .details { margin: 20px 0; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h2>E-Pass QR Code</h2>
          <div class="qr-container">
            <div id="qr-code"></div>
          </div>
          <div class="details">
            <div class="detail-row">
              <span class="label">Student:</span> ${outpass?.student_name || 'N/A'}
            </div>
            <div class="detail-row">
              <span class="label">From:</span> ${outpass?.from_date} ${outpass?.from_time}
            </div>
            <div class="detail-row">
              <span class="label">To:</span> ${outpass?.to_date} ${outpass?.to_time}
            </div>
            <div class="detail-row">
              <span class="label">Reason:</span> ${outpass?.reason}
            </div>
            <div class="detail-row">
              <span class="label">Valid Until:</span> ${outpass?.qr_expires_at}
            </div>
          </div>
          <script>
            // Generate QR code in print window
            const qrContainer = document.getElementById('qr-code');
            const qrCode = new QRCode(qrContainer, {
              text: '${outpass?.qr_code || ''}',
              width: 200,
              height: 200
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `outpass-${outpassId}-qr.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
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
              {outpass.qr_code ? (
                <Box>
                  <QRCode
                    value={outpass.qr_code}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                  
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
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Valid Until:</strong> {outpass.qr_expires_at}
                  </Typography>
                  
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Show this QR code to the security guard when leaving and returning to the hostel.
                  </Alert>
                </Box>
              ) : (
                <Alert severity="warning">
                  QR code not available for this outpass.
                </Alert>
              )}
            </Paper>
          </Box>
        ) : (
          <Alert severity="info">No outpass data available.</Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        {outpass?.qr_code && (
          <>
            <Button
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              variant="outlined"
            >
              Print
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              variant="outlined"
            >
              Download
            </Button>
          </>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRCodeDisplay; 