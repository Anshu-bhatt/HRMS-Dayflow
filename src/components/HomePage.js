import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setTimeout(() => {
      navigate(`/login/${role}`);
    }, 300);
  };

  return (
    <div className="home-container">
      <div className="background-animation">
        <div className="circle circle1"></div>
        <div className="circle circle2"></div>
        <div className="circle circle3"></div>
      </div>

      <div className="content-wrapper">
        <header className="home-header">
          <div className="logo-section">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="logo-text">HRMS</h1>
          </div>
          <p className="tagline">Human Resource Management System</p>
        </header>

        <main className="main-content">
          <div className="welcome-section">
            <h2 className="welcome-title">Welcome Back!</h2>
            <p className="welcome-subtitle">Select your role to continue</p>
          </div>

          <div className="login-options">
            <div 
              className={`login-card employee-card ${selectedRole === 'employee' ? 'selected' : ''}`}
              onClick={() => handleRoleSelection('employee')}
            >
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="card-title">Employee Login</h3>
              <p className="card-description">
                Access your profile, attendance, leave requests, and payroll information
              </p>
              <div className="card-arrow">→</div>
            </div>

            <div 
              className={`login-card admin-card ${selectedRole === 'admin' ? 'selected' : ''}`}
              onClick={() => handleRoleSelection('admin')}
            >
              <div className="card-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="card-title">Admin / HR Login</h3>
              <p className="card-description">
                Manage employees, approve requests, and oversee payroll operations
              </p>
              <div className="card-arrow">→</div>
            </div>
          </div>

          <div className="features-section">
            <h3 className="features-title">Key Features</h3>
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">👤</span>
                <span>Profile Management</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📅</span>
                <span>Attendance Tracking</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🏖️</span>
                <span>Leave Management</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <span>Payroll Visibility</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="home-footer">
          <p>&copy; 2026 HRMS. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
