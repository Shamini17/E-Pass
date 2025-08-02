import React, { useState, useEffect, useCallback } from 'react';
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
import { toast } from 'react-toastify';

const DemoQRCode = ({ open, onClose, studentData = null }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    if (open) {
      generateDemoQRCode();
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

  const generateDemoQRCode = useCallback(() => {
    setLoading(true);
    setError('');
    setQrData(null);
    setDebugInfo('');

    try {
      console.log('🔄 Generating Demo QR code...');
      
      // Create demo QR data immediately
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      const qrData = {
        student_id: 'STU001',
        name: studentData?.name || 'Demo Student',
        outpass_id: Math.floor(Math.random() * 1000) + 1,
        from_date: new Date().toISOString().split('T')[0],
        from_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        to_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 hours from now
        to_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        reason: 'Demo outpass for testing',
        place: 'Demo Location',
        city: 'Demo City',
        generated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        type: 'demo_qr'
      };

      const qrString = JSON.stringify(qrData);
      setQrData(qrString);
      setExpiresAt(expiresAt.toISOString());
      setTimeRemaining(5 * 60 * 1000);
      setDebugInfo(`Demo QR Generated, Length: ${qrString.length}`);
      
      console.log('✅ Demo QR Code generated successfully:', {
        length: qrString.length,
        preview: qrString.substring(0, 100) + '...'
      });
      
      toast.success('Demo QR code generated successfully!');
    } catch (error) {
      console.error('❌ Demo QR Code generation failed:', error);
      setError('Failed to generate demo QR code');
      setDebugInfo(`Error: ${error.message}`);
      toast.error('Failed to generate demo QR code');
    } finally {
      setLoading(false);
    }
  }, [studentData]);

  const handleRefresh = () => {
    generateDemoQRCode();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const studentName = studentData?.name || 'Demo Student';
    const roomNumber = studentData?.room_number || 'Demo Room';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Demo QR Code - ${studentName}</title>
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
            <h3>Demo QR Code</h3>
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
            ⚠️ This is a DEMO QR code for testing purposes only.
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
      const studentName = studentData?.name?.replace(/\s+/g, '_') || 'demo_student';
      link.download = `demo-qr-code-${studentName}-${Date.now()}.png`;
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

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <QrCodeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Demo QR Code</Typography>
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
              Generating Demo QR Code...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : isValidQRData ? (
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
                    Room {studentData.room_number || 'Demo Room'}
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
              {/* QR Code Rendering */}
              <Box>
                <QRCode
                  value={qrData}
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
                  (Demo QR Code)
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
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <DebugIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="subtitle2" color="warning.main">
                    Debug Info:
                  </Typography>
                </Box>
                <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                  {debugInfo}
                </Typography>
                <Typography variant="body2" fontFamily="monospace" fontSize="0.7rem" color="textSecondary" sx={{ mt: 1 }}>
                  QR Data Preview: {qrData ? qrData.substring(0, 50) + '...' : 'None'}
                </Typography>
              </Paper>
            )}

            {/* Demo Notice */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Demo Mode:</strong> This is a demonstration QR code for testing purposes.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • QR code contains sample student data
              </Typography>
              <Typography variant="body2">
                • Valid for 5 minutes from generation
              </Typography>
              <Typography variant="body2">
                • Can be scanned by watchmen for testing
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
                  Demo JSON String
                </Typography>
              </Box>
            </Paper>
          </Box>
        ) : (
          <Alert severity="info">
            No QR code data available. Click "Refresh" to generate a demo QR code.
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        {isValidQRData && (
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

export default DemoQRCode; 