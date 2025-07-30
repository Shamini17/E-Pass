import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ExitToApp as ApplyIcon,
  QrCode as QrCodeIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { studentAPI } from '../services/api';
import { toast } from 'react-toastify';

// Dashboard Overview Component
const DashboardOverview = () => {
  const { user } = useAuth();
  const [activeOutpass, setActiveOutpass] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [activeResponse, historyResponse, notificationsResponse] = await Promise.all([
        studentAPI.getActiveOutpass(),
        studentAPI.getOutpassHistory({ limit: 5 }),
        studentAPI.getNotifications()
      ]);

      setActiveOutpass(activeResponse.data.activeOutpass);
      setRecentHistory(historyResponse.data.outpasses);
      setNotifications(notificationsResponse.data.notifications);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'rejected':
        return <CancelIcon color="error" />;
      default:
        return <ScheduleIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Student ID: {user?.student_id} | Manage your outpasses and stay updated.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Active Outpass Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <QrCodeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Outpass</Typography>
              </Box>
              
              {activeOutpass ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    You have an active outpass
                  </Alert>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>From:</strong> {activeOutpass.from_date} {activeOutpass.from_time}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>To:</strong> {activeOutpass.to_date} {activeOutpass.to_time}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    <strong>Reason:</strong> {activeOutpass.reason}
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<QrCodeIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => window.open(`/student/outpass/${activeOutpass.id}`, '_blank')}
                  >
                    View QR Code
                  </Button>
                </Box>
              ) : (
                <Alert severity="info">
                  No active outpass. Apply for a new one when needed.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {recentHistory.filter(o => o.status === 'approved').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Approved
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {recentHistory.filter(o => o.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Pending
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Outpass History
              </Typography>
              
              {recentHistory.length > 0 ? (
                <Box>
                  {recentHistory.map((outpass) => (
                    <Box key={outpass.id} mb={2} p={2} border="1px solid #e0e0e0" borderRadius={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1">
                            {outpass.from_date} - {outpass.to_date}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {outpass.reason}
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(outpass.status)}
                          label={outpass.status}
                          color={getStatusColor(outpass.status)}
                          size="small"
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No outpass history yet.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        {notifications.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notifications
                </Typography>
                {notifications.map((notification) => (
                  <Alert key={notification.id} severity="info" sx={{ mb: 1 }}>
                    {notification.message}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

// Apply Outpass Component
const ApplyOutpass = () => {
  const [formData, setFormData] = useState({
    reason: '',
    from_date: '',
    from_time: '',
    to_date: '',
    to_time: '',
    parent_contact: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await studentAPI.applyOutpass(formData);
      toast.success('Outpass application submitted successfully!');
      setFormData({
        reason: '',
        from_date: '',
        from_time: '',
        to_date: '',
        to_time: '',
        parent_contact: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Apply for Outpass
      </Typography>
      
      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Outpass Details
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <textarea
                  name="reason"
                  placeholder="Reason for outpass (required)"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <input
                  type="date"
                  name="from_date"
                  value={formData.from_date}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <input
                  type="time"
                  name="from_time"
                  value={formData.from_time}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <input
                  type="date"
                  name="to_date"
                  value={formData.to_date}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <input
                  type="time"
                  name="to_time"
                  value={formData.to_time}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <input
                  type="text"
                  name="parent_contact"
                  placeholder="Parent Contact (Phone/Email)"
                  value={formData.parent_contact}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    startIcon={<ApplyIcon />}
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

// My Outpasses Component
const MyOutpasses = () => {
  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOutpasses();
  }, []);

  const fetchOutpasses = async () => {
    try {
      const response = await studentAPI.getOutpassHistory();
      setOutpasses(response.data.outpasses);
    } catch (error) {
      toast.error('Failed to fetch outpass history');
    } finally {
      setLoading(false);
    }
  };

  const filteredOutpasses = filter === 'all' 
    ? outpasses 
    : outpasses.filter(outpass => outpass.status === filter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Outpasses
        </Typography>
        <Box>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {filteredOutpasses.map((outpass) => (
          <Grid item xs={12} md={6} key={outpass.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6">
                    {outpass.from_date} - {outpass.to_date}
                  </Typography>
                  <Chip
                    label={outpass.status}
                    color={getStatusColor(outpass.status)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Reason:</strong> {outpass.reason}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Time:</strong> {outpass.from_time} - {outpass.to_time}
                </Typography>

                {outpass.status === 'approved' && (
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeIcon />}
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => window.open(`/student/outpass/${outpass.id}`, '_blank')}
                  >
                    View QR Code
                  </Button>
                )}

                {outpass.return_status && (
                  <Box mt={1}>
                    <Chip
                      label={`Return: ${outpass.return_status}`}
                      color={outpass.return_status === 'late' ? 'error' : 'success'}
                      size="small"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredOutpasses.length === 0 && (
        <Alert severity="info">
          No outpasses found with the selected filter.
        </Alert>
      )}
    </Container>
  );
};

// Profile Component
const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    parent_phone: user?.parent_phone || '',
    parent_email: user?.parent_email || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await studentAPI.updateProfile(formData);
      updateUser({ ...user, ...formData });
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar sx={{ width: 80, height: 80, mr: 2 }}>
              {user?.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5">{user?.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                Student ID: {user?.student_id}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {editing ? (
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <input
                    type="text"
                    name="parent_phone"
                    placeholder="Parent Phone"
                    value={formData.parent_phone}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <input
                    type="email"
                    name="parent_email"
                    placeholder="Parent Email"
                    value={formData.parent_email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" gap={2}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Email:</strong> {user?.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Phone:</strong> {user?.phone || 'Not provided'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Parent Phone:</strong> {user?.parent_phone || 'Not provided'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Parent Email:</strong> {user?.parent_email || 'Not provided'}
              </Typography>

              <Button
                variant="contained"
                onClick={() => setEditing(true)}
                sx={{ mt: 2 }}
              >
                Edit Profile
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

// Settings Component
const Settings = () => {
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true
  });

  const handleNotificationChange = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={() => handleNotificationChange('email')}
                  style={{ marginRight: '8px' }}
                />
                <Typography variant="body2">
                  Email Notifications
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center">
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={() => handleNotificationChange('sms')}
                  style={{ marginRight: '8px' }}
                />
                <Typography variant="body2">
                  SMS Notifications
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account
              </Typography>
              
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleLogout}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

// Main Student Dashboard Component
const StudentDashboard = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardOverview />} />
      <Route path="/apply" element={<ApplyOutpass />} />
      <Route path="/outpasses" element={<MyOutpasses />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};

export default StudentDashboard; 