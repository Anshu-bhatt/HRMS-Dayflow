import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import './SignupPage.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('employee');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    position: '',
    phone: '',
    adminCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations'];
  // Uses env var if set; falls back to a default for dev to avoid “not configured” blocks
  const ADMIN_CODE = (import.meta.env.VITE_ADMIN_SIGNUP_CODE || 'DAYFLOW2026').trim();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (userType === 'employee' && !formData.department) {
      setError('Department is required for employees');
      return false;
    }
    if (userType === 'admin') {
      const requiredCode = ADMIN_CODE;
      const enteredCode = (formData.adminCode || '').trim();

      if (!requiredCode) {
        setError('Admin signup code is not configured.');
        return false;
      }

      if (enteredCode !== requiredCode) {
        setError('Invalid admin code');
        return false;
      }
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Create Firebase Authentication user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Update user profile with full name
      await updateProfile(user, {
        displayName: formData.fullName
      });

      // Save user data to Firestore based on user type
      const userData = {
        fullName: formData.fullName,
        name: formData.fullName, // alias for admin table display
        email: formData.email,
        userType,
        userId: user.uid,
        ...(userType === 'employee' && {
          department: formData.department,
          position: formData.position,
          phone: formData.phone,
          status: 'Active',
        }),
        createdAt: serverTimestamp(),
      };

      // Save to Firestore users collection (use auth uid as doc id to avoid duplicates/rule blocks)
      const usersRef = collection(db, 'users');
      await setDoc(doc(usersRef, user.uid), userData);

      // Save employee-specific data if applicable
      if (userType === 'employee') {
        const employeesRef = collection(db, 'employees');
        await setDoc(doc(employeesRef, user.uid), {
          ...userData,
          name: formData.fullName,
          joinDate: serverTimestamp(),
        });
      }

      console.log('Signup successful:', userData);

      alert(`${userType === 'admin' ? 'Admin' : 'Employee'} account created successfully!`);
      navigate(userType === 'admin' ? '/admin/dashboard' : '/');
    } catch (err) {
      // Handle specific Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or login.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check and try again.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Header */}
        <div className="signup-header">
          <div className="logo-section">
            <h1>Dayflow</h1>
            <p>HRMS System</p>
          </div>
        </div>

        {/* User Type Selection */}
        <div className="user-type-selector">
          <button
            className={`type-btn ${userType === 'employee' ? 'active' : ''}`}
            onClick={() => {
              setUserType('employee');
              setError('');
              setFormData({ ...formData, adminCode: '' });
            }}
          >
            <span className="type-icon">👤</span>
            <span className="type-label">Employee</span>
          </button>
          <button
            className={`type-btn ${userType === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setUserType('admin');
              setError('');
              setFormData({ ...formData, department: '', position: '' });
            }}
          >
            <span className="type-icon">👨‍💼</span>
            <span className="type-label">Admin</span>
          </button>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="signup-form">
          <h2>Create Your {userType === 'admin' ? 'Admin' : 'Employee'} Account</h2>

          {error && <div className="error-message">{error}</div>}

          {/* Full Name */}
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+91 9876543210"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Employee-specific fields */}
          {userType === 'employee' && (
            <>
              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Position</label>
                <input
                  type="text"
                  name="position"
                  placeholder="e.g., Senior Developer"
                  value={formData.position}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </>
          )}

          {/* Admin-specific fields */}
          {userType === 'admin' && (
            <div className="form-group">
              <label>Admin Code *</label>
              <input
                type="password"
                name="adminCode"
                placeholder="Enter admin registration code"
                value={formData.adminCode}
                onChange={handleInputChange}
                disabled={loading}
              />
              <small className="help-text">Contact system administrator for the code</small>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          {/* Terms and Conditions */}
          <div className="terms-section">
            <input type="checkbox" id="terms" required disabled={loading} />
            <label htmlFor="terms">
              I agree to the <a href="#terms">Terms and Conditions</a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="signup-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : `Create ${userType === 'admin' ? 'Admin' : 'Employee'} Account`}
          </button>
        </form>

        {/* Login Link */}
        <div className="login-link">
          <p>
            Already have an account? <Link to="/login/employee">Login here</Link>
          </p>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <h3>Why Join Dayflow?</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <h4>Track Performance</h4>
              <p>Monitor attendance and leave requests</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <h4>Manage Payroll</h4>
              <p>Transparent salary management system</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <h4>Team Collaboration</h4>
              <p>Better employee-management communication</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <h4>Secure & Private</h4>
              <p>Your data is protected with enterprise security</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
