import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TextField,
  IconButton
} from '@mui/material';
import { 
  QrCodeScanner as QrCodeScannerIcon,
  ExitToApp as ExitIcon,
  Input as EntryIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Close,
  CameraAlt,
  Stop
} from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { studentAPI } from '../services/api';
import { toast } from 'react-toastify';

const StudentQRScanner = ({ open, onClose, onScanComplete }) => {
  const [action, setAction] = useState('exit');
  const [manualQR, setManualQR] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  
  const html5QrScannerRef = useRef(null);

  const startScanner = useCallback(() => {
    try {
      setCameraError(null);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      html5QrScannerRef.current = new Html5QrcodeScanner(
        "student-qr-reader",
        config,
        false
      );

      html5QrScannerRef.current.render(onScanSuccess, onScanFailure);
      
    } catch (error) {
      console.error('Scanner start error:', error);
      setCameraError('Failed to start camera scanner. Please check camera permissions.');
    }
  }, []);

  const stopScanner = () => {
    if (html5QrScannerRef.current) {
      try {
        html5QrScannerRef.current.clear();
        html5QrScannerRef.current = null;
      } catch (error) {
        console.error('Scanner stop error:', error);
      }
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log('QR Code detected:', decodedText);
    setScanning(false);
    handleScan(decodedText);
  };

  const onScanFailure = (error) => {
    console.log('Scan attempt failed:', error);
  };

  const resetScanner = useCallback(() => {
    setAction('exit');
    setManualQR('');
    setScanResult(null);
    setLoading(false);
    setError('');
    setScanning(false);
    setCameraError(null);
    stopScanner();
  }, []);

  const handleScan = async (qrData) => {
    if (!qrData) return;
    
    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const response = await studentAPI.validateQR({
        qr_data: qrData,
        action: action
      });

      const { can_proceed, message, student, outpass, current_status } = response.data;
      
      setScanResult({
        canProceed: can_proceed,
        message,
        student,
        outpass,
        currentStatus: current_status
      });

      if (can_proceed) {
        toast.success(`QR Code validated! ${message}`);
      } else {
        toast.error(`QR Code validation failed: ${message}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to validate QR code';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = () => {
    if (!manualQR.trim()) {
      toast.error('Please enter QR code data');
      return;
    }
    handleScan(manualQR.trim());
  };

  const toggleScanner = () => {
    if (scanning) {
      setScanning(false);
    } else {
      setScanning(true);
    }
  };

  const handleConfirmAction = async () => {
    if (!scanResult) return;

    setLoading(true);
    try {
      const response = await studentAPI.logEntryExit({
        qr_data: scanResult.outpass.qr_data,
        action: action
      });

      toast.success(response.data.message);
      if (onScanComplete) {
        onScanComplete();
      }
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to log entry/exit';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getActionIcon = () => {
    return action === 'exit' ? <ExitIcon /> : <EntryIcon />;
  };

  const getActionColor = () => {
    return action === 'exit' ? 'warning' : 'success';
  };

  const handleClose = () => {
    resetScanner();
    onClose();
  };

  useEffect(() => {
    if (open) {
      resetScanner();
    }
  }, [open, resetScanner]);

  useEffect(() => {
    if (open && scanning) {
      startScanner();
    } else if (!scanning && html5QrScannerRef.current) {
      stopScanner();
    }

    return () => {
      if (html5QrScannerRef.current) {
        stopScanner();
      }
    };
  }, [open, scanning, startScanner]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Student QR Code Scanner
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!scanResult && !error && (
          <Box>
            {/* Action Selection */}
            <Box mb={3} display="flex" justifyContent="center" gap={2}>
              <Button
                variant={action === 'exit' ? 'contained' : 'outlined'}
                startIcon={<ExitIcon />}
                onClick={() => setAction('exit')}
                disabled={scanning}
              >
                Exit Scan
              </Button>
              <Button
                variant={action === 'entry' ? 'contained' : 'outlined'}
                startIcon={<EntryIcon />}
                onClick={() => setAction('entry')}
                disabled={scanning}
              >
                Entry Scan
              </Button>
            </Box>

            {/* Camera Error Display */}
            {cameraError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {cameraError}
                </Typography>
              </Alert>
            )}

            {/* Scanner Interface */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Box textAlign="center">
                {loading ? (
                  <Box>
                    <CircularProgress size={60} />
                    <Typography variant="h6" mt={2}>
                      Processing QR Code...
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mt={1}>
                      Please wait while we validate the outpass
                    </Typography>
                  </Box>
                ) : scanning ? (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {action === 'exit' ? 'Scan Exit QR Code' : 'Scan Entry QR Code'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                      Point your camera at the QR code
                    </Typography>
                    
                    {/* Camera Scanner Container */}
                    <Box 
                      id="student-qr-reader" 
                      sx={{ 
                        width: '100%', 
                        maxWidth: '400px', 
                        margin: '0 auto',
                        '& video': {
                          borderRadius: '8px'
                        }
                      }}
                    />
                    
                    <Box mt={2}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Stop />}
                        onClick={toggleScanner}
                      >
                        Stop Scanner
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <QrCodeScannerIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {action === 'exit' ? 'Scan Exit QR Code' : 'Scan Entry QR Code'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={3}>
                      {action === 'exit' 
                        ? 'Scan the QR code when leaving the hostel'
                        : 'Scan the QR code when returning to the hostel'
                      }
                    </Typography>
                    
                    <Box display="flex" gap={2} justifyContent="center">
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<CameraAlt />}
                        onClick={toggleScanner}
                      >
                        Start Camera Scanner
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Manual Input Section */}
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Manual QR Code Input
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                If camera scanning doesn't work, you can manually enter the QR code data
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="QR Code Data (JSON format)"
                value={manualQR}
                onChange={(e) => setManualQR(e.target.value)}
                placeholder='{"student_id": "12345", "outpass_id": "67890", ...}'
                sx={{ mb: 2 }}
              />
              
              <Button
                variant="outlined"
                onClick={handleManualScan}
                disabled={!manualQR.trim() || loading}
              >
                Validate QR Code
              </Button>
            </Paper>
          </Box>
        )}

        {/* Scan Result Display */}
        {scanResult && (
          <Box>
            <Alert 
              severity={scanResult.canProceed ? 'success' : 'error'} 
              icon={scanResult.canProceed ? <SuccessIcon /> : <ErrorIcon />}
              sx={{ mb: 2 }}
            >
              <Typography variant="h6">
                {scanResult.message}
              </Typography>
            </Alert>

            <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Student Information
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon color="primary" />
                  <Typography variant="body2">
                    <strong>Name:</strong> {scanResult.student.name}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon color="primary" />
                  <Typography variant="body2">
                    <strong>Student ID:</strong> {scanResult.student.student_id}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationIcon color="primary" />
                  <Typography variant="body2">
                    <strong>Room:</strong> {scanResult.student.room_number}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Outpass Details
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Status:</Typography>
                  <Chip 
                    label={scanResult.outpass.status} 
                    color={getStatusColor(scanResult.outpass.status)}
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Purpose:</Typography>
                  <Typography variant="body2">{scanResult.outpass.purpose}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">From:</Typography>
                  <Typography variant="body2">{scanResult.outpass.from_date}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">To:</Typography>
                  <Typography variant="body2">{scanResult.outpass.to_date}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Current Status:</Typography>
                  <Typography variant="body2">{scanResult.currentStatus}</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
            <Typography variant="h6">
              Scan Failed
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        {scanResult && scanResult.canProceed && (
          <Button 
            onClick={handleConfirmAction} 
            variant="contained" 
            color={getActionColor()}
            startIcon={getActionIcon()}
            disabled={loading}
          >
            Confirm {action === 'exit' ? 'Exit' : 'Entry'}
          </Button>
        )}
        {scanResult && (
          <Button onClick={resetScanner} variant="outlined">
            Scan Another
          </Button>
        )}
        {error && (
          <Button onClick={resetScanner} variant="outlined">
            Try Again
          </Button>
        )}
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentQRScanner; 