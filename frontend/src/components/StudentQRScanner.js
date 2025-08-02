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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { 
  QrCodeScanner as QrCodeScannerIcon,
  ExitToApp as ExitIcon,
  Input as EntryIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { studentAPI } from '../services/api';
import { toast } from 'react-toastify';

const StudentQRScanner = ({ open, onClose, onScanComplete }) => {
  const [action, setAction] = useState('exit');
  const [manualQR, setManualQR] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      resetScanner();
    }
  }, [open]);

  const resetScanner = () => {
    setAction('exit');
    setManualQR('');
    setScanResult(null);
    setLoading(false);
    setError('');
  };

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

  const handleConfirmAction = async () => {
    if (!scanResult?.canProceed) return;

    setLoading(true);
    try {
      // Here you would typically call the watchman API to log the entry/exit
      // For now, we'll simulate the action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`${action === 'exit' ? 'Exit' : 'Entry'} logged successfully!`);
      
      if (onScanComplete) {
        onScanComplete({
          student: scanResult.student,
          action: action,
          timestamp: new Date().toISOString()
        });
      }
      
      onClose();
    } catch (error) {
      toast.error('Failed to log action');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'inside': return 'success';
      case 'outside': return 'warning';
      case 'returned': return 'info';
      default: return 'default';
    }
  };

  const getActionIcon = () => {
    return action === 'exit' ? <ExitIcon /> : <EntryIcon />;
  };

  const getActionColor = () => {
    return action === 'exit' ? 'error' : 'success';
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <QrCodeScannerIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Student QR Code Scanner</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Action Selection */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Select Action:
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              label="Action"
            >
              <MenuItem value="exit">
                <Box display="flex" alignItems="center">
                  <ExitIcon sx={{ mr: 1, color: 'error.main' }} />
                  Exit (Student leaving)
                </Box>
              </MenuItem>
              <MenuItem value="entry">
                <Box display="flex" alignItems="center">
                  <EntryIcon sx={{ mr: 1, color: 'success.main' }} />
                  Entry (Student returning)
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {/* Manual QR Input */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Manual QR Code Input:
          </Typography>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              label="QR Code Data"
              value={manualQR}
              onChange={(e) => setManualQR(e.target.value)}
              placeholder="Paste QR code data here..."
              multiline
              rows={2}
            />
            <Button
              variant="contained"
              onClick={handleManualScan}
              disabled={loading || !manualQR.trim()}
              sx={{ minWidth: 100 }}
            >
              Scan
            </Button>
          </Box>
        </Paper>

        {/* Loading State */}
        {loading && (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Validating QR Code...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Scan Result */}
        {scanResult && (
          <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">
                Scan Result
              </Typography>
              <Chip
                icon={scanResult.canProceed ? <SuccessIcon /> : <ErrorIcon />}
                label={scanResult.canProceed ? 'Valid' : 'Invalid'}
                color={scanResult.canProceed ? 'success' : 'error'}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Student Information */}
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Student Information:
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body1">
                  {scanResult.student.name} ({scanResult.student.student_id})
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="textSecondary">
                  Room {scanResult.student.room_number}
                </Typography>
              </Box>
            </Box>

            {/* Outpass Information */}
            {scanResult.outpass && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Outpass Details:
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="textSecondary">From:</Typography>
                  <Typography variant="body2">{scanResult.outpass.from}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="textSecondary">To:</Typography>
                  <Typography variant="body2">{scanResult.outpass.to}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="textSecondary">Reason:</Typography>
                  <Typography variant="body2">{scanResult.outpass.reason}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="textSecondary">Place:</Typography>
                  <Typography variant="body2">{scanResult.outpass.place}, {scanResult.outpass.city}</Typography>
                </Box>
              </Box>
            )}

            {/* Current Status */}
            {scanResult.currentStatus && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Status:
                </Typography>
                <Box display="flex" alignItems="center" mb={1}>
                  <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Chip
                    label={scanResult.currentStatus.exit_time ? 'Has Exited' : 'Inside'}
                    color={getStatusColor(scanResult.currentStatus.exit_time ? 'outside' : 'inside')}
                    size="small"
                  />
                </Box>
                {scanResult.currentStatus.exit_time && (
                  <Typography variant="body2" color="textSecondary">
                    Exit Time: {new Date(scanResult.currentStatus.exit_time).toLocaleString()}
                  </Typography>
                )}
                {scanResult.currentStatus.entry_time && (
                  <Typography variant="body2" color="textSecondary">
                    Entry Time: {new Date(scanResult.currentStatus.entry_time).toLocaleString()}
                  </Typography>
                )}
              </Box>
            )}

            {/* Action Message */}
            <Alert 
              severity={scanResult.canProceed ? 'success' : 'warning'}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>Status:</strong> {scanResult.message}
              </Typography>
            </Alert>

            {/* Action Confirmation */}
            {scanResult.canProceed && (
              <Box display="flex" alignItems="center" justifyContent="center">
                <Button
                  variant="contained"
                  color={getActionColor()}
                  startIcon={getActionIcon()}
                  onClick={handleConfirmAction}
                  disabled={loading}
                  size="large"
                >
                  Confirm {action === 'exit' ? 'Exit' : 'Entry'}
                </Button>
              </Box>
            )}
          </Paper>
        )}

        {/* Instructions */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Instructions:</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            • Select whether the student is leaving (Exit) or returning (Entry)
          </Typography>
          <Typography variant="body2">
            • Paste the QR code data in the text field above
          </Typography>
          <Typography variant="body2">
            • Click "Scan" to validate the QR code
          </Typography>
          <Typography variant="body2">
            • Confirm the action if validation is successful
          </Typography>
        </Alert>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentQRScanner; 