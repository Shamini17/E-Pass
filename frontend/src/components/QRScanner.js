import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import {
  QrCodeScanner,
  ExitToApp,
  Login,
  Close,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { watchmanAPI } from '../services/api';

const QRScanner = ({ open, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [action, setAction] = useState('exit'); // 'exit' or 'entry'
  const [processing, setProcessing] = useState(false);

  const handleScan = async (qrData) => {
    if (processing) return;
    
    setProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('Scanning QR code:', qrData);
      
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

  const handleManualInput = () => {
    const qrData = prompt('Enter QR code data (JSON format):');
    if (qrData) {
      handleScan(qrData);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setScanning(false);
  };

  const handleClose = () => {
    resetScanner();
    onClose();
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
          <Button onClick={handleClose} startIcon={<Close />}>
            Close
          </Button>
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
              >
                Exit Scan
              </Button>
              <Button
                variant={action === 'entry' ? 'contained' : 'outlined'}
                startIcon={<Login />}
                onClick={() => setAction('entry')}
              >
                Entry Scan
              </Button>
            </Box>

            {/* Scanner Interface */}
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  {scanning ? (
                    <Box>
                      <CircularProgress size={60} />
                      <Typography variant="h6" mt={2}>
                        Scanning QR Code...
                      </Typography>
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        Please hold the QR code steady
                      </Typography>
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
                          startIcon={<QrCodeScanner />}
                          onClick={() => setScanning(true)}
                        >
                          Start Scanner
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
                • Late returns will be automatically detected and logged
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