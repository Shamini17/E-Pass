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
  Alert
} from '@mui/material';
import {
  Notifications,
  History,
  School,
  Assessment,
  CheckCircle,
  Pending,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { wardenAPI } from '../services/api';
import { toast } from 'react-toastify';

const WardenDashboard = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    total: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [pendingResponse] = await Promise.all([
        wardenAPI.getPendingRequests({ limit: 5 })
      ]);

      setPendingRequests(pendingResponse.data.outpasses);
      setStats({
        pending: pendingResponse.data.pagination.total,
        total: 0, // Will be updated when we fetch all outpasses
        approved: 0,
        rejected: 0
      });
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle color="success" />;
      case 'pending':
        return <Pending color="warning" />;
      case 'rejected':
        return <Cancel color="error" />;
      default:
        return <Pending />;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Warden Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome, {user?.name}. Manage outpass applications and student requests.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Notifications color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.pending}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Requests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <History color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Outpasses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.approved}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Cancel color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.rejected}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Rejected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Requests */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Pending Outpass Requests
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  href="/warden/pending"
                >
                  View All
                </Button>
              </Box>
              
              {pendingRequests.length > 0 ? (
                <List>
                  {pendingRequests.map((request, index) => (
                    <React.Fragment key={request.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Typography variant="subtitle1">
                                {request.student_name} - {request.student_id}
                              </Typography>
                              <Chip
                                icon={getStatusIcon(request.status)}
                                label={request.status}
                                color="warning"
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Reason: {request.reason}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {request.from_date} {request.from_time} - {request.to_date} {request.to_time}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Room: {request.room_number} | Parent: {request.parent_phone}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < pendingRequests.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No pending outpass requests at the moment.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<Notifications />}
                  fullWidth
                  href="/warden/pending"
                >
                  Review Pending Requests
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<History />}
                  fullWidth
                  href="/warden/outpasses"
                >
                  View All Outpasses
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<School />}
                  fullWidth
                  href="/warden/students"
                >
                  Manage Students
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  fullWidth
                  href="/warden/reports"
                >
                  Generate Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default WardenDashboard; 