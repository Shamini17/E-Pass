import React, { useState, useEffect, useCallback } from 'react';
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
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Notifications,
  History,
  School,
  Assessment,
  CheckCircle,
  Pending,
  Cancel,
  ArrowBack,
  QrCode
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { wardenAPI } from '../services/api';
import { toast } from 'react-toastify';
import QRCode from 'qrcode.react';
import QRCodeDisplay from '../components/QRCodeDisplay';

const WardenDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [navigationHistory, setNavigationHistory] = useState(['dashboard']);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allOutpasses, setAllOutpasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    total: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOutpass, setSelectedOutpass] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: 'approved',
    comments: ''
  });
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedOutpassForQR, setSelectedOutpassForQR] = useState(null);

  // Debug authentication state
  console.log('WardenDashboard - User:', user, 'IsAuthenticated:', isAuthenticated);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pendingResponse, allOutpassesResponse] = await Promise.all([
        wardenAPI.getPendingRequests({ limit: 5 }),
        wardenAPI.getAllOutpasses({ limit: 100 })
      ]);

      // Handle pending requests - backend returns 'requests' not 'outpasses'
      const pendingData = pendingResponse.data.requests || [];
      setPendingRequests(pendingData);

      // Handle all outpasses for stats
      const allOutpassesData = allOutpassesResponse.data.outpasses || [];
      setAllOutpasses(allOutpassesData);
      
      // Calculate stats
      const approved = allOutpassesData.filter(o => o.status === 'approved').length;
      const rejected = allOutpassesData.filter(o => o.status === 'rejected').length;
      const pending = pendingResponse.data.pagination?.total || 0;
      const total = allOutpassesData.length;

      setStats({
        pending,
        total,
        approved,
        rejected
      });

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Failed to fetch dashboard data');
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOutpasses = async () => {
    try {
      setLoading(true);
      const response = await wardenAPI.getAllOutpasses({ limit: 100 });
      setAllOutpasses(response.data.outpasses || []);
    } catch (error) {
      toast.error('Failed to fetch outpasses');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // For now, we'll extract student data from outpasses
      const response = await wardenAPI.getAllOutpasses({ limit: 100 });
      const outpasses = response.data.outpasses || [];
      const uniqueStudents = outpasses.reduce((acc, outpass) => {
        const studentKey = `${outpass.student_id}-${outpass.student_name}`;
        if (!acc[studentKey]) {
          acc[studentKey] = {
            id: outpass.student_id,
            name: outpass.student_name,
            room_number: outpass.room_number,
            total_outpasses: 0
          };
        }
        acc[studentKey].total_outpasses++;
        return acc;
      }, {});
      setStudents(Object.values(uniqueStudents));
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (view) => {
    console.log('Navigating from', currentView, 'to', view);
    setNavigationHistory(prev => [...prev, view]);
    setCurrentView(view);
    if (view === 'outpasses') {
      fetchAllOutpasses();
    } else if (view === 'students') {
      fetchStudents();
    }
  };

  const handleBackNavigation = useCallback(() => {
    console.log('Back navigation triggered');
    if (navigationHistory.length > 1) {
      const newHistory = [...navigationHistory];
      newHistory.pop(); // Remove current view
      const previousView = newHistory[newHistory.length - 1];
      console.log('Going back to:', previousView);
      setNavigationHistory(newHistory);
      setCurrentView(previousView);
    } else {
      console.log('No previous view, staying on dashboard');
      setCurrentView('dashboard');
    }
  }, [navigationHistory]);

  // Handle browser back button - moved after handleBackNavigation definition
  useEffect(() => {
    const handlePopState = (event) => {
      console.log('Browser back button pressed');
      event.preventDefault();
      handleBackNavigation();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBackNavigation]);

  const handleApproveOutpass = async (outpass) => {
    setSelectedOutpass(outpass);
    // Always reset approval data to default when opening the dialog
    setApprovalData({ status: 'approved', comments: '' });
    setApprovalDialog(true);
  };

  const handleViewQR = async (outpass) => {
    if (!outpass.qr_code) {
      // Try to fetch the latest outpass data if qr_code is missing
      try {
        const response = await wardenAPI.getAllOutpasses({ limit: 100 });
        const updatedOutpass = response.data.outpasses.find(o => o.id === outpass.id);
        if (updatedOutpass && updatedOutpass.qr_code) {
          setSelectedOutpassForQR(updatedOutpass);
          setQrDialogOpen(true);
          return;
        } else {
          toast.error('QR code not available for this outpass. Please try again later.');
          return;
        }
      } catch (error) {
        toast.error('Failed to load QR code data. Please try again.');
        return;
      }
    }
    // If qr_code is present, open the dialog directly
    setSelectedOutpassForQR(outpass);
    setQrDialogOpen(true);
  };

  const handleApprovalSubmit = async () => {
    try {
      const requestData = {
        action: approvalData.status === 'approved' ? 'approve' : 'reject',
        rejection_reason: approvalData.status === 'rejected' ? approvalData.comments : undefined
      };

      console.log('Submitting approval with data:', requestData);
      const response = await wardenAPI.approveOutpass(selectedOutpass.id, requestData);
      console.log('Approval response:', response.data);
      
      if (approvalData.status === 'approved' && response.data.qrCode) {
        console.log('QR Code received, updating selectedOutpass');
        // Update the selectedOutpass with QR code data for display
        const updatedOutpass = {
          ...selectedOutpass,
          qr_code: response.data.qrCode,
          status: 'approved'
        };
        setSelectedOutpass(updatedOutpass);
        
        // Also update the allOutpasses list to include the QR code
        setAllOutpasses(prevOutpasses => 
          prevOutpasses.map(o => 
            o.id === selectedOutpass.id ? updatedOutpass : o
          )
        );
        
        toast.success('Outpass approved successfully! QR code generated.');
      } else {
        console.log('No QR code in response or not approved');
        toast.success(`Outpass ${approvalData.status}`);
        setApprovalDialog(false);
        setSelectedOutpass(null);
        setApprovalData({ status: 'approved', comments: '' });
        // Refresh data to get updated outpass information
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to update outpass status');
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

  // Ensure user is authenticated and is a warden
  if (!isAuthenticated || !user || user.role !== 'warden') {
    console.log('User not authenticated or not a warden, redirecting...');
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography variant="h6">Access denied. Please login as a warden.</Typography>
        </Box>
      </Container>
    );
  }

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

  // Render different views based on currentView state
  console.log('Current view:', currentView, 'Navigation history:', navigationHistory);
  
  if (currentView === 'pending') {
    return (
      <Container maxWidth="lg">
        <Box mb={4}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackNavigation}
            sx={{ mb: 2 }}
          >
            {navigationHistory.length > 1 ? 'Go Back' : 'Dashboard'}
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Pending Outpass Requests
          </Typography>
        </Box>

        <Card>
          <CardContent>
            {pendingRequests && pendingRequests.length > 0 ? (
              <List>
                {pendingRequests.map((request, index) => (
                  <React.Fragment key={request.id}>
                    <ListItem>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
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
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          Reason: {request.reason}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          {request.from_date} {request.from_time} - {request.to_date} {request.to_time}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Room: {request.room_number} | Parent: {request.parent_phone}
                        </Typography>
                      </Box>
                      <Box>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleApproveOutpass(request)}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => {
                            setApprovalData({ status: 'rejected', comments: '' });
                            handleApproveOutpass(request);
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </ListItem>
                    {index < pendingRequests.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={3}>
                <Typography variant="body1" color="textSecondary">
                  No pending requests at the moment.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (currentView === 'outpasses') {
    return (
      <Container maxWidth="lg">
        <Box mb={4}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackNavigation}
            sx={{ mb: 2 }}
          >
            {navigationHistory.length > 1 ? 'Go Back' : 'Dashboard'}
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            All Outpasses
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allOutpasses.map((outpass) => (
                    <TableRow key={outpass.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {outpass.student_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {outpass.student_id}
                        </Typography>
                      </TableCell>
                      <TableCell>{outpass.reason}</TableCell>
                      <TableCell>
                        {outpass.from_date} {outpass.from_time} - {outpass.to_date} {outpass.to_time}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(outpass.status)}
                          label={outpass.status}
                          color={getStatusColor(outpass.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {outpass.status === 'pending' && (
                          <Box>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleApproveOutpass(outpass)}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => {
                                setApprovalData({ status: 'rejected', comments: '' });
                                handleApproveOutpass(outpass);
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                        {outpass.status === 'approved' && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<QrCode />}
                            onClick={() => handleViewQR(outpass)}
                          >
                            View QR
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (currentView === 'students') {
    return (
      <Container maxWidth="lg">
        <Box mb={4}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackNavigation}
            sx={{ mb: 2 }}
          >
            {navigationHistory.length > 1 ? 'Go Back' : 'Dashboard'}
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Student Directory
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Room Number</TableCell>
                    <TableCell>Total Outpasses</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.room_number}</TableCell>
                      <TableCell>{student.total_outpasses}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (currentView === 'reports') {
    return (
      <Container maxWidth="lg">
        <Box mb={4}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackNavigation}
            sx={{ mb: 2 }}
          >
            {navigationHistory.length > 1 ? 'Go Back' : 'Dashboard'}
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Reports & Analytics
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Outpass Statistics
                </Typography>
                <Box>
                  <Typography variant="body1">
                    Total Outpasses: {stats.total}
                  </Typography>
                  <Typography variant="body1">
                    Pending: {stats.pending}
                  </Typography>
                  <Typography variant="body1">
                    Approved: {stats.approved}
                  </Typography>
                  <Typography variant="body1">
                    Rejected: {stats.rejected}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Reports feature coming soon...
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Main Dashboard View
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
                  onClick={() => handleViewChange('pending')}
                >
                  View All
                </Button>
              </Box>
              
              {pendingRequests && pendingRequests.length > 0 ? (
                <List>
                  {pendingRequests.map((request, index) => (
                    <React.Fragment key={request.id}>
                      <ListItem>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
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
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                            Reason: {request.reason}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                            {request.from_date} {request.from_time} - {request.to_date} {request.to_time}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Room: {request.room_number} | Parent: {request.parent_phone}
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < pendingRequests.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography variant="body1" color="textSecondary">
                    No pending requests at the moment.
                  </Typography>
                </Box>
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
                  fullWidth
                  onClick={() => handleViewChange('pending')}
                  startIcon={<Notifications />}
                >
                  Review Pending Requests
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleViewChange('outpasses')}
                  startIcon={<History />}
                >
                  View All Outpasses
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleViewChange('students')}
                  startIcon={<School />}
                >
                  Student Directory
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleViewChange('reports')}
                  startIcon={<Assessment />}
                >
                  Generate Reports
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => {
        setApprovalDialog(false);
        setSelectedOutpass(null);
        setApprovalData({ status: 'approved', comments: '' });
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedOutpass?.status === 'pending' ? `${approvalData.status === 'approved' ? 'Approve' : 'Reject'} Outpass` : 'Outpass'}
        </DialogTitle>
        <DialogContent>
          {selectedOutpass?.status === 'pending' ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                Student: {selectedOutpass?.student_name} ({selectedOutpass?.student_id})
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Reason: {selectedOutpass?.reason}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={approvalData.status}
                  onChange={(e) => setApprovalData({ ...approvalData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="approved">Approve</MenuItem>
                  <MenuItem value="rejected">Reject</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Comments (optional)"
                fullWidth
                multiline
                minRows={2}
                sx={{ mt: 2 }}
                value={approvalData.comments}
                onChange={(e) => setApprovalData({ ...approvalData, comments: e.target.value })}
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setApprovalDialog(false);
            setSelectedOutpass(null);
            setApprovalData({ status: 'approved', comments: '' });
          }}>
            {selectedOutpass?.status === 'approved' ? 'Close' : 'Cancel'}
          </Button>
          {selectedOutpass?.status !== 'approved' && (
            <Button 
              onClick={handleApprovalSubmit}
              variant="contained"
              color={approvalData.status === 'approved' ? 'success' : 'error'}
            >
              {approvalData.status === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* QR Code Display Dialog */}
      <QRCodeDisplay
        outpassId={selectedOutpassForQR?.id}
        outpassData={selectedOutpassForQR}
        open={qrDialogOpen}
        onClose={() => {
          setQrDialogOpen(false);
          setSelectedOutpassForQR(null);
        }}
      />
      {console.log('QRCodeDisplay props:', {
        outpassId: selectedOutpassForQR?.id,
        outpassData: selectedOutpassForQR,
        open: qrDialogOpen
      })}
    </Container>
  );
};

export default WardenDashboard; 