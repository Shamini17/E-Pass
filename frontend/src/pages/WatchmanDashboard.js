import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  QrCodeScanner,
  ExitToApp,
  CheckCircle,
  Schedule,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { watchmanAPI } from '../services/api';
import { toast } from 'react-toastify';

const WatchmanDashboard = () => {
  const { user } = useAuth();
  const [todayLogs, setTodayLogs] = useState([]);
  const [pendingReturns, setPendingReturns] = useState([]);
  const [stats, setStats] = useState({
    todayExits: 0,
    todayEntries: 0,
    pendingReturns: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [logsResponse, pendingResponse] = await Promise.all([
        watchmanAPI.getTodayLogs(),
        watchmanAPI.getPendingReturns()
      ]);

      setTodayLogs(logsResponse.data.logs);
      setPendingReturns(pendingResponse.data.pendingReturns);

      // Calculate stats
      const todayExits = logsResponse.data.logs.filter(log => log.exit_time).length;
      const todayEntries = logsResponse.data.logs.filter(log => log.entry_time).length;
      
      setStats({
        todayExits,
        todayEntries,
        pendingReturns: pendingResponse.data.pendingReturns.length
      });
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    }
  };

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
                href="/watchman/scanner"
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
    </Container>
  );
};

export default WatchmanDashboard; 