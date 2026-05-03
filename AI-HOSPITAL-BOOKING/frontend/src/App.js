import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import PatientDashboard from './pages/PatientDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import AmbulanceDashboard from './pages/AmbulanceDashboard';
import EmergencyRequest from './pages/EmergencyRequest';
import BloodAvailability from './pages/BloodAvailability';
import EmergencyTracking from './pages/EmergencyTracking';

const AppRoutes = () => {
  const { user } = useAuth();

  const getDashboard = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'hospital_admin') return <Navigate to="/hospital-dashboard" replace />;
    if (user.role === 'ambulance') return <Navigate to="/ambulance-dashboard" replace />;
    return <Navigate to="/patient-dashboard" replace />;
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? getDashboard() : <Login />} />
      <Route path="/register" element={user ? getDashboard() : <Register />} />
      <Route path="/dashboard" element={getDashboard()} />
      <Route path="/blood-availability" element={<BloodAvailability />} />

      <Route path="/patient-dashboard" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <PatientDashboard />
        </ProtectedRoute>
      } />
      <Route path="/emergency-request" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <EmergencyRequest />
        </ProtectedRoute>
      } />
      <Route path="/emergency/:id" element={
        <ProtectedRoute>
          <EmergencyTracking />
        </ProtectedRoute>
      } />
      <Route path="/hospital-dashboard" element={
        <ProtectedRoute allowedRoles={['hospital_admin']}>
          <HospitalDashboard />
        </ProtectedRoute>
      } />
      <Route path="/ambulance-dashboard" element={
        <ProtectedRoute allowedRoles={['ambulance']}>
          <AmbulanceDashboard />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' }
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
