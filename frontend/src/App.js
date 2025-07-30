import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import StudentRegistration from './pages/StudentRegistration';
import StudentDashboard from './pages/StudentDashboard';
import WardenDashboard from './pages/WardenDashboard';
import WatchmanDashboard from './pages/WatchmanDashboard';
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<StudentRegistration />} />
        
        {/* Student Routes */}
        <Route path="/student/*" element={
          <Layout>
            <StudentDashboard />
          </Layout>
        } />
        
        {/* Warden Routes */}
        <Route path="/warden/*" element={<WardenDashboard />} />
        
        {/* Watchman Routes */}
        <Route path="/watchman/*" element={<WatchmanDashboard />} />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminDashboard />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App; 