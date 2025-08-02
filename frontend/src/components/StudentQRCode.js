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
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { 
  QrCode as QrCodeIcon, 
  Print as PrintIcon, 
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import QRCode from 'qrcode.react';
import { studentAPI } from '../services/api';
import { toast } from 'react-toastify';

const StudentQRCode = ({ open, onClose, studentData = null }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (open) {
      generateQRCode();
    }
  }, [open]);

  useEffect(() => {
    let interval;
    if (expiresAt && timeRemaining > 0) {
      interval = setInterval(() => {
        const remaining = Math.max(0, new Date(expiresAt) - new Date());
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setError('QR code has expired. Please generate a new one.');
          clearInterval(interval);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [expiresAt, timeRemaining]);

  const generateQRCode = async () => {
    setLoading(true);
    setError('');
    setQrData(null);

    try {
      const response = await studentAPI.generateQR();
      const { qr_code, expires_at } = response.data;
      
      setQrData(qr_code);
      setExpiresAt(expires_at);
      setTimeRemaining(new Date(expires_at) - new Date());
      
      toast.success('QR code generated successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to generate QR code';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    generateQRCode();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const studentName = studentData?.name || 'Student';
    const roomNumber = studentData?.room_number || 'N/A';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Student QR Code - ${studentName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
              margin: 0;
            }
            .header { 
              margin-bottom: 20px; 
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .qr-container { 
              margin: 20px 0; 
              display: flex;
              justify-content: center;
            }
            .details { 
              margin: 20px 0; 
              text-align: left; 
              max-width: 400px; 
              margin-left: auto; 
              margin-right: auto; 
            }
            .detail-row { 
              margin: 10px 0; 
              display: flex;
              justify-content: space-between;
            }
            .label { 
              font-weight: bold; 
              color: #333;
            }
            .value {
              color: #666;
            }
            .expiry {
              color: #d32f2f;
              font-weight: bold;
              margin-top: 10px;
            }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🏫 E-Pass Management System</h2>
            <h3>Student QR Code</h3>
          </div>
          
          <div class="qr-container">
            <div id="qr-code"></div>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">Student Name:</span>
              <span class="value">${studentName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Room Number:</span>
              <span class="value">${roomNumber}</span>
            </div>
            <div class="detail-row">
              <span class="label">Generated:</span>
              <span class="value">${new Date().toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Expires:</span>
              <span class="value">${expiresAt ? new Date(expiresAt).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
          
          <div class="expiry">
            ⚠️ This QR code expires in 5 minutes. Show it to security when leaving/entering.
          </div>
          
          <script>
            // Generate QR code in print window
            const qrContainer = document.getElementById('qr-code');
            const qrCode = new QRCode(qrContainer, {
              text: '${qrData || ''}',
              width: 200,
              height: 200,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: QRCode.CorrectLevel.H
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
      const studentName = studentData?.name?.replace(/\s+/g, '_') || 'student';
      link.download = `qr-code-${studentName}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const formatTimeRemaining = (ms) => {
    if (ms <= 0) return 'Expired';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (!timeRemaining) return 'default';
    if (timeRemaining <= 60000) return 'error'; // 1 minute
    if (timeRemaining <= 180000) return 'warning'; // 3 minutes
    return 'success';
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <QrCodeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Student QR Code</Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Generating QR Code...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : qrData ? (
          <Box>
            {/* Student Info */}
            {studentData && (
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">{studentData.name}</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="textSecondary">
                    Room {studentData.room_number || 'N/A'}
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* QR Code */}
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', mb: 2 }}>
              <QRCode
                value={qrData}
                size={200}
                level="H"
                includeMargin={true}
              />
              
              {/* Expiry Timer */}
              {expiresAt && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<TimeIcon />}
                    label={`Expires in: ${formatTimeRemaining(timeRemaining)}`}
                    color={getStatusColor()}
                    variant="outlined"
                  />
                </Box>
              )}
            </Paper>

            {/* Instructions */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Instructions:</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • Show this QR code to the security guard when leaving the hostel
              </Typography>
              <Typography variant="body2">
                • Show it again when returning to the hostel
              </Typography>
              <Typography variant="body2">
                • QR code expires in 5 minutes for security
              </Typography>
            </Alert>

            {/* QR Code Details */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                QR Code Details:
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="textSecondary">Generated:</Typography>
                <Typography variant="body2">
                  {new Date().toLocaleString()}
                </Typography>
              </Box>
              {expiresAt && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Expires:</Typography>
                  <Typography variant="body2">
                    {new Date(expiresAt).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        ) : (
          <Alert severity="info">
            No QR code data available. Click "Refresh" to generate a new QR code.
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        {qrData && (
          <>
            <Button
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              variant="outlined"
              disabled={!qrData}
            >
              Print
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              variant="outlined"
              disabled={!qrData}
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

export default StudentQRCode; 