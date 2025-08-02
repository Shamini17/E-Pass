import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  QrCodeScanner,
  ExitToApp,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { watchmanAPI } from '../services/api';
import QRScanner from '../components/QRScanner';
import StudentQRScanner from '../components/StudentQRScanner';
import { toast } from 'react-toastify';

const WatchmanDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayExits: 0,
    todayEntries: 0,
    pendingReturns: 0
  });
  const [pendingReturns, setPendingReturns] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [studentQrScannerOpen, setStudentQrScannerOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardResponse, pendingResponse, logsResponse] = await Promise.all([
        watchmanAPI.getDashboard(),
        watchmanAPI.getPendingReturns(),
        watchmanAPI.getTodayLogs()
      ]);

      setStats(dashboardResponse.data.stats);
      setPendingReturns(pendingResponse.data.pendingReturns || []);
      setTodayLogs(logsResponse.data.logs || []);

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Failed to fetch dashboard data');
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQrScannerClose = () => {
    setQrScannerOpen(false);
    // Refresh dashboard data after QR scan
    fetchDashboardData();
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography variant="h6">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Watchman Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome, {user?.name}. Scan QR codes and manage student entry/exit.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ExitToApp color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.todayExits}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Today's Exits
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Schedule color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.todayEntries}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Today's Entries
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.pendingReturns}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Returns
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* QR Scanner */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                QR Code Scanner
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={3}>
                Scan student QR codes to log entry and exit
              </Typography>
              <Button
                variant="contained"
                startIcon={<QrCodeScanner />}
                fullWidth
                size="large"
                onClick={() => setQrScannerOpen(true)}
              >
                Open QR Scanner
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Returns */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Pending Returns
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  href="/watchman/pending"
                >
                  View All
                </Button>
              </Box>
              
              {pendingReturns.length > 0 ? (
                <List>
                  {pendingReturns.slice(0, 3).map((student, index) => (
                    <React.Fragment key={student.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1">
                              {student.student_name} - {student.student_id}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Room: {student.room_number}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Exited: {new Date(student.exit_time).toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Expected Return: {student.to_date} {student.to_time}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(pendingReturns.length, 3) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No pending returns at the moment.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Logs */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Today's Entry/Exit Logs
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  href="/watchman/logs"
                >
                  View All
                </Button>
              </Box>
              
              {todayLogs.length > 0 ? (
                <List>
                  {todayLogs.slice(0, 5).map((log, index) => (
                    <React.Fragment key={log.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1">
                              {log.student_name} - {log.student_id}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Exit: {log.exit_time ? new Date(log.exit_time).toLocaleString() : 'Not logged'} | 
                                Entry: {log.entry_time ? new Date(log.entry_time).toLocaleString() : 'Not returned'}
                              </Typography>
                              {log.return_status && (
                                <Typography variant="body2" color="textSecondary">
                                  Status: {log.return_status}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(todayLogs.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No logs for today yet.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <QRScanner open={qrScannerOpen} onClose={handleQrScannerClose} />
      <StudentQRScanner 
        open={studentQrScannerOpen} 
        onClose={() => setStudentQrScannerOpen(false)}
        onScanComplete={handleQrScannerClose}
      />
    </Container>
  );
};

export default WatchmanDashboard; 