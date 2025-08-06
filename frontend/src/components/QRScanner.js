import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton
} from '@mui/material';
import {
  QrCodeScanner,
  ExitToApp,
  Login,
  Close,
  CheckCircle,
  Error,
  CameraAlt,
  Stop
} from '@mui/icons-material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { watchmanAPI } from '../services/api';

const QRScanner = ({ open, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [action, setAction] = useState('exit'); // 'exit' or 'entry'
  const [processing, setProcessing] = useState(false);
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
        "qr-reader",
        config,
        false
      );

      html5QrScannerRef.current.render(onScanSuccess, onScanFailure);
      
    } catch (error) {
      console.error('Scanner start error:', error);
      setCameraError('Failed to start camera scanner. Please check camera permissions.');
    }
  }, []);

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
    
    if (processing) return;
    
    setProcessing(true);
    setError(null);
    setResult(null);
    setScanning(false);

    try {
      // Try to parse JSON if it's a JSON string
      let qrData = decodedText;
      try {
        const parsed = JSON.parse(decodedText);
        qrData = JSON.stringify(parsed);
      } catch (e) {
        // If not JSON, use as is
        qrData = decodedText;
      }

      console.log('Processing QR data:', qrData);
      
      const response = await watchmanAPI.scanQR({
        qrData: qrData,
        action: action
      });

      setResult(response.data);
      console.log('Scan result:', response.data);

    } catch (error) {
      console.error('Scan error:', error);
      setError(error.response?.data?.error || 'Failed to process QR code');
    } finally {
      setProcessing(false);
    }
  };

  const onScanFailure = (error) => {
    // This is called when QR code scanning fails
    // We don't need to handle this as it's just scanning attempts
    console.log('Scan attempt failed:', error);
  };

  const handleManualInput = () => {
    const qrData = prompt('Enter QR code data (JSON format):');
    if (qrData) {
      onScanSuccess(qrData);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setScanning(false);
    setCameraError(null);
    stopScanner();
  };

  const handleClose = () => {
    resetScanner();
    onClose();
  };

  const toggleScanner = () => {
    if (scanning) {
      setScanning(false);
    } else {
      setScanning(true);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            QR Code Scanner
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!result && !error && (
          <Box>
            {/* Action Selection */}
            <Box mb={3} display="flex" justifyContent="center" gap={2}>
              <Button
                variant={action === 'exit' ? 'contained' : 'outlined'}
                startIcon={<ExitToApp />}
                onClick={() => setAction('exit')}
                disabled={scanning}
              >
                Exit Scan
              </Button>
              <Button
                variant={action === 'entry' ? 'contained' : 'outlined'}
                startIcon={<Login />}
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
            <Card>
              <CardContent>
                <Box textAlign="center" py={2}>
                  {processing ? (
                    <Box>
                      <CircularProgress size={60} />
                      <Typography variant="h6" mt={2}>
                        Processing QR Code...
                      </Typography>
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        Please wait while we verify the outpass
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
                        id="qr-reader" 
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
                      <QrCodeScanner sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        {action === 'exit' ? 'Scan Exit QR Code' : 'Scan Entry QR Code'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" mb={3}>
                        {action === 'exit' 
                          ? 'Scan the QR code when student is leaving the hostel'
                          : 'Scan the QR code when student is returning to the hostel'
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
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={handleManualInput}
                        >
                          Manual Input
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Instructions:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • For <strong>Exit Scan</strong>: Scan when student is leaving the hostel<br/>
                • For <strong>Entry Scan</strong>: Scan when student is returning to the hostel<br/>
                • QR codes are only valid during the approved outpass time period<br/>
                • Late returns will be automatically detected and logged<br/>
                • Make sure to allow camera permissions when prompted
              </Typography>
            </Box>
          </Box>
        )}

        {/* Result Display */}
        {result && (
          <Box>
            <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
              <Typography variant="h6">
                {result.message}
              </Typography>
            </Alert>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Student Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="textSecondary">Name:</Typography>
                    <Typography variant="body2">{result.student.name}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="textSecondary">Student ID:</Typography>
                    <Typography variant="body2">{result.student.student_id}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="textSecondary">Room:</Typography>
                    <Typography variant="body2">{result.student.room_number}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="textSecondary">Action:</Typography>
                    <Chip 
                      label={result.action === 'exit' ? 'Exit Logged' : 'Entry Logged'} 
                      color={result.action === 'exit' ? 'warning' : 'success'}
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="textSecondary">Timestamp:</Typography>
                    <Typography variant="body2">{result.timestamp}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" icon={<Error />} sx={{ mb: 2 }}>
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
        {result && (
          <Button onClick={resetScanner} variant="contained">
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

export default QRScanner; 