import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  People,
  Notifications
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    today: {},
    thisMonth: {},
    lateReturnsToday: 0,
    pendingReturns: 0,
    totalStudents: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Welcome, {user?.name}. View comprehensive reports and analytics.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Today's Stats */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Today's Statistics
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assessment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.today?.total_outpasses || 0}</Typography>
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
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.today?.approved_outpasses || 0}</Typography>
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
                <Notifications color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.today?.pending_outpasses || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending
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
                <People color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.today?.rejected_outpasses || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Rejected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Stats */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Additional Statistics
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Notifications color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.lateReturnsToday || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Late Returns Today
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
                <People color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.pendingReturns || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Returns
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
                <People color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.totalStudents || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Students
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
                <Assessment color="secondary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.thisMonth?.total_outpasses || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    This Month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    href="/admin/reports/outpass"
                  >
                    Outpass Reports
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    href="/admin/reports/late-returns"
                  >
                    Late Returns Report
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    href="/admin/reports/reasons"
                  >
                    Reasons Report
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    href="/admin/reports/student-activity"
                  >
                    Student Activity
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard; 