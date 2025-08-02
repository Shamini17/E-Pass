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
  LocationOn as LocationIcon,
  BugReport as DebugIcon
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
  const [debugInfo, setDebugInfo] = useState('');

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
    setDebugInfo('');

    try {
      console.log('🔄 Generating QR code...');
      const response = await studentAPI.generateQR();
      console.log('📡 API Response:', response);
      
      const { qr_code, expires_at } = response.data;
      
      // Validate QR code data
      if (!qr_code) {
        throw new Error('No QR code data received from server');
      }
      
      // Check if it's a base64 image or JSON string
      const isBase64Image = qr_code.startsWith('data:image/') || qr_code.startsWith('iVBORw0KGgo');
      
      setQrData(qr_code);
      setExpiresAt(expires_at);
      setTimeRemaining(new Date(expires_at) - new Date());
      
      // Set debug info
      setDebugInfo(`QR Type: ${isBase64Image ? 'Base64 Image' : 'JSON String'}, Length: ${qr_code.length}`);
      
      console.log('✅ QR Code generated successfully:', {
        type: isBase64Image ? 'Base64 Image' : 'JSON String',
        length: qr_code.length,
        preview: qr_code.substring(0, 100) + '...'
      });
      
      toast.success('QR code generated successfully!');
    } catch (error) {
      console.error('❌ QR Code generation failed:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate QR code';
      setError(errorMessage);
      setDebugInfo(`Error: ${errorMessage}`);
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
              border: 2px solid #333;
              padding: 20px;
              background: white;
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

  // Check if QR data is valid
  const isValidQRData = qrData && qrData.length > 0;
  
  // Check if it's a base64 image
  const isBase64Image = qrData && (qrData.startsWith('data:image/') || qrData.startsWith('iVBORw0KGgo'));

  // Ensure we have a valid string for QR code generation
  const qrCodeValue = isValidQRData ? qrData : 'No data available';

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
        ) : (
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

            {/* QR Code Container with Enhanced Styling */}
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                textAlign: 'center', 
                mb: 2,
                border: '2px solid #e0e0e0',
                backgroundColor: '#fafafa'
              }}
            >
              {/* Always render QR code - with fallback if no data */}
              <Box>
                <QRCode
                  value={qrData || 'No QR data available'}
                  size={200}
                  level="H"
                  includeMargin={true}
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: 'white'
                  }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  {qrData ? (isBase64Image ? '(Base64 Image)' : '(Generated QR Code)') : '(Fallback QR Code)'}
                </Typography>
              </Box>
              
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

            {/* Debug Information (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <DebugIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="subtitle2" color="warning.main">
                    Debug Info:
                  </Typography>
                </Box>
                <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                  {debugInfo || 'No debug info available'}
                </Typography>
                <Typography variant="body2" fontFamily="monospace" fontSize="0.7rem" color="textSecondary" sx={{ mt: 1 }}>
                  QR Data Length: {qrData ? qrData.length : 0} | Type: {isBase64Image ? 'Base64' : 'String'}
                </Typography>
                <Typography variant="body2" fontFamily="monospace" fontSize="0.7rem" color="textSecondary">
                  QR Value Preview: {qrCodeValue.substring(0, 50) + '...'}
                </Typography>
              </Paper>
            )}

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
              <Box display="flex" justifyContent="space-between" sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="textSecondary">Type:</Typography>
                <Typography variant="body2">
                  {isValidQRData ? (isBase64Image ? 'Base64 Image' : 'JSON String') : 'Fallback'}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
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
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentQRCode; 