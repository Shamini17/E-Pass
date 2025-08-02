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
  Alert,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ExitToApp as ApplyIcon,
  QrCode as QrCodeIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  QrCode2 as QrCode2Icon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { studentAPI } from '../services/api';
import { toast } from 'react-toastify';
import StudentQRCode from '../components/StudentQRCode';
import DemoQRCode from '../components/DemoQRCode';
import QRCodeTest from '../components/QRCodeTest';
import SimpleQRTest from '../components/SimpleQRTest';
import QRCodeDebug from '../components/QRCodeDebug';

// Dashboard Overview Component
const DashboardOverview = () => {
  const { user } = useAuth();
  const [activeOutpass, setActiveOutpass] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrStatus, setQrStatus] = useState(null);
  const [demoQrDialogOpen, setDemoQrDialogOpen] = useState(false);
  const [debugQrOpen, setDebugQrOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchQRStatus();
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

  const fetchQRStatus = async () => {
    try {
      const response = await studentAPI.getQRStatus();
      setQrStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch QR status:', error);
    }
  };

  const handleGenerateQR = () => {
    setQrDialogOpen(true);
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
                  
                  {/* QR Status Display */}
                  {qrStatus?.has_active_outpass && (
                    <Box mb={2}>
                      <Chip
                        label={`Status: ${qrStatus.current_status}`}
                        color={qrStatus.current_status === 'inside' ? 'success' : 
                               qrStatus.current_status === 'outside' ? 'warning' : 'info'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {qrStatus.qr_code_valid && (
                        <Chip
                          label="QR Valid"
                          color="success"
                          size="small"
                        />
                      )}
                    </Box>
                  )}
                  
                  <Box display="flex" gap={1}>
                    <Button
                      variant="contained"
                      startIcon={<QrCode2Icon />}
                      onClick={handleGenerateQR}
                      disabled={!qrStatus?.has_active_outpass}
                    >
                      Generate QR Code
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<QrCodeIcon />}
                      onClick={() => window.open(`/student/outpass/${activeOutpass.id}`, '_blank')}
                    >
                      View Outpass
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<QrCodeIcon />}
                      onClick={() => setDemoQrDialogOpen(true)}
                    >
                      Demo QR
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<QrCodeIcon />}
                      onClick={() => {
                        // Simple test - create a QR code directly
                        const testData = {
                          student_id: 'TEST001',
                          name: user?.name || 'Test Student',
                          timestamp: new Date().toISOString(),
                          type: 'test'
                        };
                        console.log('Testing QR code with data:', testData);
                        alert('Check console for QR test data. QR code should appear in the dialog.');
                        setQrDialogOpen(true);
                      }}
                    >
                      Test QR
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<QrCodeIcon />}
                      onClick={() => setDebugQrOpen(true)}
                    >
                      Debug QR
                    </Button>
                  </Box>
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

      {/* QR Code Dialog */}
      <StudentQRCode
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        studentData={user}
      />
      
      {/* Demo QR Code Dialog */}
      <DemoQRCode
        open={demoQrDialogOpen}
        onClose={() => setDemoQrDialogOpen(false)}
        studentData={user}
      />
      
      {/* Debug QR Code Dialog */}
      <QRCodeDebug
        open={debugQrOpen}
        onClose={() => setDebugQrOpen(false)}
      />
    </Container>
  );
};

// Apply Outpass Component
const ApplyOutpass = () => {
  // Get today's date in YYYY-MM-DD format for minimum date validation
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    reason: '',
    place: '',
    city: '',
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
        place: '',
        city: '',
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
                  type="text"
                  name="place"
                  placeholder="Place/Address (required)"
                  value={formData.place}
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
                  type="text"
                  name="city"
                  placeholder="City (required)"
                  value={formData.city}
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
                  name="from_date"
                  value={formData.from_date}
                  onChange={handleChange}
                  min={today}
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
                  min={formData.from_date || today}
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
                  <strong>Place:</strong> {outpass.place}, {outpass.city}
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
    room_number: user?.room_number || '',
    
    // Academic Information
    college_name: user?.college_name || '',
    current_year: user?.current_year || 1,
    department: user?.department || '',
    other_department: user?.other_department || '',
    branch: user?.branch || '',
    batch: user?.batch || '',
    warden_name: user?.warden_name || '',
    warden_contact: user?.warden_contact || '',
    
    // Personal Information
    date_of_birth: user?.date_of_birth || '',
    blood_group: user?.blood_group || '',
    gender: user?.gender || '',
    
    // Address Information
    home_town: user?.home_town || '',
    permanent_address: user?.permanent_address || '',
    emergency_address: user?.emergency_address || '',
    
    // Identity Information
    id_proof_type: user?.id_proof_type || '',
    id_proof_number: user?.id_proof_number || '',
    
    // Parent Information
    parent_phone: user?.parent_phone || '',
    parent_email: user?.parent_email || '',
    parent_occupation: user?.parent_occupation || ''
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

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const idProofTypes = ['Aadhar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID', 'College ID'];
  const departments = [
    'Automobile Engineering',
    'Civil Engineering',
    'Computer Science Engineering',
    'Electrical and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Information Technology',
    'Mechanical Engineering',
    'Others'
  ];
  const years = [1, 2, 3, 4];

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Name:</strong> {user?.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Student ID:</strong> {user?.student_id}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Email:</strong> {user?.email}
                </Typography>
                {editing ? (
                  <>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      margin="normal"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Room Number"
                      name="room_number"
                      value={formData.room_number}
                      onChange={handleChange}
                      margin="normal"
                      size="small"
                    />
                  </>
                ) : (
                  <>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Phone:</strong> {user?.phone}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Room Number:</strong> {user?.room_number}
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Academic Information
              </Typography>
              
              {editing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="College Name"
                      name="college_name"
                      value={formData.college_name}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Current Year</InputLabel>
                      <Select
                        name="current_year"
                        value={formData.current_year}
                        onChange={handleChange}
                        label="Current Year"
                      >
                        {years.map(year => (
                          <MenuItem key={year} value={year}>{year}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Department</InputLabel>
                      <Select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        label="Department"
                      >
                        {departments.map(dept => (
                          <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {formData.department === 'Others' && (
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Specify Department"
                        name="other_department"
                        value={formData.other_department || ''}
                        onChange={handleChange}
                        size="small"
                        helperText="Please specify your department name"
                        placeholder="e.g., Biotechnology, Chemical Engineering, etc."
                      />
                    </Grid>
                  )}
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Branch"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Batch"
                      name="batch"
                      value={formData.batch}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    <strong>College:</strong> {user?.college_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Year:</strong> {user?.current_year}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Department:</strong> {user?.department}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Branch:</strong> {user?.branch}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Batch:</strong> {user?.batch}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              
              {editing ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Blood Group</InputLabel>
                      <Select
                        name="blood_group"
                        value={formData.blood_group}
                        onChange={handleChange}
                        label="Blood Group"
                      >
                        {bloodGroups.map(group => (
                          <MenuItem key={group} value={group}>{group}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Gender</InputLabel>
                      <Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        label="Gender"
                      >
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Home Town"
                      name="home_town"
                      value={formData.home_town}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Date of Birth:</strong> {user?.date_of_birth}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Blood Group:</strong> {user?.blood_group}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Gender:</strong> {user?.gender}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Home Town:</strong> {user?.home_town}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Address Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Address Information
              </Typography>
              
              {editing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Permanent Address"
                      name="permanent_address"
                      multiline
                      rows={2}
                      value={formData.permanent_address}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Emergency Address"
                      name="emergency_address"
                      multiline
                      rows={2}
                      value={formData.emergency_address}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Permanent Address:</strong> {user?.permanent_address}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Emergency Address:</strong> {user?.emergency_address}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Identity Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Identity Information
              </Typography>
              
              {editing ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>ID Proof Type</InputLabel>
                      <Select
                        name="id_proof_type"
                        value={formData.id_proof_type}
                        onChange={handleChange}
                        label="ID Proof Type"
                      >
                        {idProofTypes.map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="ID Proof Number"
                      name="id_proof_number"
                      value={formData.id_proof_number}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    <strong>ID Proof Type:</strong> {user?.id_proof_type}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>ID Proof Number:</strong> {user?.id_proof_number}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Administrative Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Administrative Information
              </Typography>
              
              {editing ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Warden Name"
                      name="warden_name"
                      value={formData.warden_name}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Warden Contact"
                      name="warden_contact"
                      value={formData.warden_contact}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Warden Name:</strong> {user?.warden_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Warden Contact:</strong> {user?.warden_contact}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Parent Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Parent Information
              </Typography>
              
              {editing ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Parent Phone"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Parent Email"
                      name="parent_email"
                      type="email"
                      value={formData.parent_email}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Parent Occupation"
                      name="parent_occupation"
                      value={formData.parent_occupation}
                      onChange={handleChange}
                      size="small"
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Parent Name:</strong> {user?.parent_name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Parent Phone:</strong> {user?.parent_phone}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Parent Email:</strong> {user?.parent_email}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Parent Occupation:</strong> {user?.parent_occupation}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        {editing ? (
          <>
            <Button
              variant="contained"
              onClick={handleSubmit}
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
          </>
        ) : (
          <Button
            variant="contained"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </Box>
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
      <Route path="/test-qr" element={<QRCodeTest />} />
    </Routes>
  );
};

export default StudentDashboard; 