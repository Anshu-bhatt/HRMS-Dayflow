import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import './LoginPage.css';

const LoginPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({
    email: '',
    password: ''
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    loginUser();
  };

  const loginUser = async () => {
    try {
      setError('');
      setLoading(true);

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // Verify user type from Firestore
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        setError('User profile not found. Please contact support.');
        return;
      }

      const userDoc = querySnapshot.docs[0].data();
      const userTypeFromDb = userDoc.userType;

      // Verify role matches
      if (userTypeFromDb !== role) {
        setError(`This account is registered as ${userTypeFromDb}. Please login with the correct role.`);
        // Sign out the user
        await auth.signOut();
        return;
      }

      console.log('Login successful:', { role, email: formData.email });
    
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      // Navigate to employee dashboard (implement later)
      alert('Employee dashboard coming soon!');
      navigate('/');
    }
    } catch (err) {
      // Handle specific Firebase errors
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';

  return (
    <div className="login-container">
      <div className="login-card-wrapper">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        
        <div className="login-card">
          <div className="login-header">
            <div className={`login-icon ${role}-icon`}>
              {isAdmin ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <h1 className="login-title">
              {isAdmin ? 'Admin / HR Login' : 'Employee Login'}
            </h1>
            <p className="login-subtitle">
              Enter your credentials to access your account
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                  disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                  disabled={loading}
                required
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                  <input type="checkbox" disabled={loading} />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

              <button type="submit" className={`login-button ${role}-button`} disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Sign Up</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
