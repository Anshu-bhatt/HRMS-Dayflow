import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './Dashboard.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user, role, logout, loading } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState('');

  // Fetch employee name from Firestore
  useEffect(() => {
    const fetchEmployeeName = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const name = userData.full_name || userData.displayName || '';
            setEmployeeName(name);
          }
        } catch (err) {
          console.error('Error fetching employee name:', err);
        }
      }
    };
    fetchEmployeeName();
  }, [user]);

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
          <h1 className="dashboard-title">Employee Dashboard</h1>
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
        <div className="welcome-card">
          <h2>Welcome, {employeeName || user?.email}!</h2>
          <p>You are logged in as an <strong>Employee</strong></p>
        </div>

        <div className="features-grid">
          <div 
            className="feature-card clickable"
            onClick={() => navigate('/employee/profile')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon">👤</div>
            <h3>My Profile</h3>
            <p>View your personal and job information</p>
            <div className="card-arrow">→</div>
          </div>

          <div 
            className="feature-card clickable"
            onClick={() => navigate('/employee/attendance')}
            style={{ cursor: 'pointer' }}
          >
            <div className="feature-icon">📅</div>
            <h3>Attendance</h3>
            <p>Check your attendance records</p>
            <div className="card-arrow">→</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏖️</div>
            <h3>Leave</h3>
            <p>Request and track your leaves</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Payroll</h3>
            <p>View your salary and payroll information</p>
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

export default EmployeeDashboard;
