import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, role, logout, loading } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
    setLogoutLoading(false);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card admin-welcome">
          <h2>Welcome, {user?.email}!</h2>
          <p>You are logged in as an <strong>Admin / HR</strong></p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Manage Employees</h3>
            <p>Add, edit, and manage employee information</p>
          </div>

          <div 
            className="feature-card clickable"
            onClick={() => navigate('/admin/attendance')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon">✅</div>
            <h3>Attendance</h3>
            <p>View all employees' attendance records</p>
            <div className="card-arrow">→</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Reports</h3>
            <p>View attendance and payroll reports</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Configure system settings and policies</p>
          </div>
        </div>

        <div className="user-info-card">
          <h3>Account Information</h3>
          <div className="info-item">
            <span className="label">Email:</span>
            <span className="value">{user?.email}</span>
          </div>
          <div className="info-item">
            <span className="label">Role:</span>
            <span className="value">{role}</span>
          </div>
          <div className="info-item">
            <span className="label">User ID:</span>
            <span className="value">{user?.uid}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
