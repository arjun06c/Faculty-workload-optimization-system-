import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AcademicsDashboard from './pages/AcademicsDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyDetails from './pages/FacultyDetails';
import DepartmentDetails from './pages/DepartmentDetails';
import FacultyTimetableView from './pages/FacultyTimetableView';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <Router>
      <GoogleOAuthProvider clientId="544538286923-58eo0dsvo3a93iifgf7uf2s273su8pe5.apps.googleusercontent.com">
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/department/:id" element={<DepartmentDetails />} />
            </Route>

            {/* Academics Routes */}
            <Route element={<ProtectedRoute allowedRoles={['academics', 'admin']} />}>
              <Route path="/academic/dashboard" element={<AcademicsDashboard />} />
              <Route path="/academic" element={<Navigate to="/academic/dashboard" replace />} />
              <Route path="/academic/faculty/:id" element={<FacultyTimetableView />} />
              <Route path="/academics" element={<Navigate to="/academic/dashboard" replace />} />
            </Route>

            {/* Faculty Routes */}
            <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
              <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
              <Route path="/faculty" element={<Navigate to="/faculty/dashboard" replace />} />
              <Route path="/faculty/details" element={<FacultyDetails />} />
            </Route>

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </AuthProvider>
      </GoogleOAuthProvider>
    </Router>
  );
}

export default App;
