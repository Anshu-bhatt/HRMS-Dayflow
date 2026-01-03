import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';
import EmployeeProfile from './components/EmployeeProfile';
import Attendance from './components/Attendance';
import Leave from './components/Leave';
import Payroll from './components/Payroll';
import AdminLeaveApproval from './components/AdminLeaveApproval';
import AdminPayroll from './components/AdminPayroll';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login/:role" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute requiredRole="employee">
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/profile"
              element={
                <ProtectedRoute requiredRole="employee">
                  <EmployeeProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/attendance"
              element={
                <ProtectedRoute requiredRole="employee">
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/leave"
              element={
                <ProtectedRoute requiredRole="employee">
                  <Leave />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/payroll"
              element={
                <ProtectedRoute requiredRole="employee">
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leave"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLeaveApproval />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payroll"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPayroll />
                </ProtectedRoute>
              }
            />

            {/* Catch-all for undefined routes */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
