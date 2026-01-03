import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import EmployeeManagement from './components/admin/EmployeeManagement';
import AttendanceManagement from './components/admin/AttendanceManagement';
import LeaveApproval from './components/admin/LeaveApproval';
import PayrollManagement from './components/admin/PayrollManagement';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login/:role" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="leave-approval" element={<LeaveApproval />} />
            <Route path="payroll" element={<PayrollManagement />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
