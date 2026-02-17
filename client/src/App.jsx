import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AcademicsDashboard from './pages/AcademicsDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import DepartmentDetails from './pages/DepartmentDetails';
import FacultyTimetableView from './pages/FacultyTimetableView';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/department/:id" element={<DepartmentDetails />} />
          </Route>

          {/* Academics Routes */}
          <Route element={<ProtectedRoute allowedRoles={['academics', 'admin']} />}>
            <Route path="/academics" element={<AcademicsDashboard />} />
            <Route path="/academics/faculty/:id" element={<FacultyTimetableView />} />
          </Route>

          {/* Faculty Routes */}
          <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
            <Route path="/faculty" element={<FacultyDashboard />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
