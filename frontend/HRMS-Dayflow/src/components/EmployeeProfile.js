import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './EmployeeProfile.css';

const EmployeeProfile = () => {
  const navigate = useNavigate();
  const { user, logout, userRole } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    if (!user || !user.uid) {
      console.log('User not authenticated, waiting...');
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get Firebase ID token with forceRefresh to ensure it's valid
      let idToken;
      try {
        console.log('Requesting Firebase token for user:', user.uid);
        idToken = await user.getIdToken(true); // forceRefresh = true
        console.log('Token obtained successfully');
        console.log('Token length:', idToken.length);
        console.log('Token first 20 chars:', idToken.substring(0, 20));
        console.log('Token last 20 chars:', idToken.substring(idToken.length - 20));
        // Verify token is a JWT (should have 3 parts separated by dots)
        const tokenParts = idToken.split('.');
        console.log('Token parts count:', tokenParts.length);
        if (tokenParts.length !== 3) {
          console.warn('WARNING: Token does not appear to be a valid JWT (expected 3 parts, got ' + tokenParts.length + ')');
        }
      } catch (tokenErr) {
        console.error('Token error:', tokenErr);
        throw new Error('Failed to get authentication token. Please refresh the page.');
      }

      if (!idToken) {
        throw new Error('No authentication token available');
      }

      console.log('Fetching profile from backend...');
      // Call backend API
      const response = await fetch('http://localhost:8000/employee/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Profile response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', response.status, errorData);
        throw new Error(errorData.detail || `Failed to fetch profile (${response.status})`);
      }

      const data = await response.json();
      setProfile(data);
      console.log('Profile fetched successfully:', data);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
    setLogoutLoading(false);
  };

  const handleEditClick = () => {
    setEditData({
      phone: profile.personal_details.phone || '',
      address: profile.personal_details.address || '',
      profile_picture_url: profile.profile_picture_url || '',
      // Admin-only fields
      full_name: profile.personal_details.full_name || '',
      email: profile.personal_details.email || '',
      designation: profile.job_details.designation || '',
      department: profile.job_details.department || '',
      employee_id: profile.job_details.employee_id || '',
      date_of_joining: profile.job_details.date_of_joining || '',
      basic_pay: profile.salary_structure.basic_pay || 0,
      allowances: profile.salary_structure.allowances || 0,
      deductions: profile.salary_structure.deductions || 0,
      net_salary: profile.salary_structure.net_salary || 0,
      aadhaar: profile.documents.aadhaar || '',
      pan: profile.documents.pan || '',
      offer_letter: profile.documents.offer_letter || '',
    });
    setIsEditMode(true);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleEditCancel = () => {
    setIsEditMode(false);
    setEditData({});
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!user || !user.uid) {
      setUpdateError('User not authenticated');
      return;
    }

    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      let idToken;
      try {
        idToken = await user.getIdToken(true); // forceRefresh = true
        console.log('Token obtained for profile update');
      } catch (tokenErr) {
        console.error('Token error:', tokenErr);
        throw new Error('Failed to get authentication token. Please refresh the page.');
      }

      if (!idToken) {
        throw new Error('No authentication token available');
      }

      // Build payload based on user role
      const payload = {
        phone: editData.phone || null,
        address: editData.address || null,
        profile_picture_url: editData.profile_picture_url || null,
        full_name: editData.full_name || null,  // Employees can edit their own name
      };

      // Add admin-only fields if user is admin
      if (userRole === 'admin') {
        payload.email = editData.email || null;
        payload.designation = editData.designation || null;
        payload.department = editData.department || null;
        payload.employee_id = editData.employee_id || null;
        payload.date_of_joining = editData.date_of_joining || null;
        payload.basic_pay = editData.basic_pay ? parseFloat(editData.basic_pay) : null;
        payload.allowances = editData.allowances ? parseFloat(editData.allowances) : null;
        payload.deductions = editData.deductions ? parseFloat(editData.deductions) : null;
        payload.net_salary = editData.net_salary ? parseFloat(editData.net_salary) : null;
        payload.aadhaar = editData.aadhaar || null;
        payload.pan = editData.pan || null;
        payload.offer_letter = editData.offer_letter || null;
      }

      console.log('Sending update payload:', payload);
      console.log('User role:', userRole);

      const response = await fetch('http://localhost:8000/employee/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', response.status, errorData);
        throw new Error(errorData.detail || `Failed to update profile (${response.status})`);
      }

      const updatedProfile = await response.json();
      console.log('Updated profile from backend:', updatedProfile);
      setProfile(updatedProfile);
      setUpdateSuccess(true);
      setIsEditMode(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
      setUpdateError(err.message || 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <div className="error-card">
          <h2>⚠️ Error Loading Profile</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchProfile} className="retry-button">
              Retry
            </button>
            <button onClick={() => navigate('/employee/dashboard')} className="back-button">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-empty">
        <div className="empty-card">
          <h2>No Profile Data</h2>
          <p>Unable to load your profile information</p>
          <button onClick={() => navigate('/employee/dashboard')} className="back-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <div className="header-content">
          <h1 className="profile-title">{isEditMode ? 'Edit Profile' : 'My Profile'}</h1>
          {!isEditMode && (
            <div className="header-buttons">
              <button
                className="edit-button"
                onClick={handleEditClick}
              >
                ✏️ Edit Profile
              </button>
              <button
                className="logout-button"
                onClick={handleLogout}
                disabled={logoutLoading}
              >
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>

        {/* Success Message */}
        {updateSuccess && (
          <div className="success-message">
            ✅ Profile updated successfully!
          </div>
        )}

        {/* Error Message */}
        {updateError && (
          <div className="error-message">
            ⚠️ {updateError}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="profile-main">
        {/* Profile Picture Section */}
        <div className="profile-picture-section">
          <div className="profile-picture-card">
            {profile.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt="Profile"
                className="profile-picture"
              />
            ) : (
              <div className="profile-avatar">
                <span className="avatar-icon">👤</span>
              </div>
            )}
            <div className="profile-name-info">
              <h2>{profile.personal_details.full_name}</h2>
              <p className="designation">{profile.job_details.designation}</p>
              <p className="department">{profile.job_details.department}</p>
            </div>
          </div>
        </div>

        {/* Personal Details Section */}
        <section className="profile-section">
          <div className="section-header">
            <h3 className="section-title">👤 Personal Details</h3>
            {isEditMode && userRole === 'admin' && (
              <span className="admin-badge">Admin Edit Mode</span>
            )}
          </div>
          <div className="section-content">
            {isEditMode ? (
              <div className="edit-form">
              <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={editData.full_name}
                      onChange={(e) => handleEditChange('full_name', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email {userRole === 'employee' && <span className="readonly">(Read-only)</span>}</label>
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => handleEditChange('email', e.target.value)}
                      disabled={userRole === 'employee'}
                      className={userRole === 'employee' ? 'readonly-input' : ''}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => handleEditChange('phone', e.target.value)}
                      placeholder="+91-XXXXX-XXXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={editData.address}
                      onChange={(e) => handleEditChange('address', e.target.value)}
                      placeholder="Street, City, State, Zip"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Full Name</label>
                  <p>{profile.personal_details.full_name}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{profile.personal_details.email}</p>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <p>{profile.personal_details.phone || 'Not provided'}</p>
                </div>
                <div className="detail-item">
                  <label>Address</label>
                  <p>{profile.personal_details.address || 'Not provided'}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Job Details Section */}
        <section className="profile-section">
          <div className="section-header">
            <h3 className="section-title">💼 Job Details</h3>
          </div>
          <div className="section-content">
            {isEditMode && userRole === 'admin' ? (
              <div className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input
                      type="text"
                      value={editData.employee_id}
                      onChange={(e) => handleEditChange('employee_id', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Designation</label>
                    <input
                      type="text"
                      value={editData.designation}
                      onChange={(e) => handleEditChange('designation', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={editData.department}
                      onChange={(e) => handleEditChange('department', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Joining</label>
                    <input
                      type="date"
                      value={editData.date_of_joining}
                      onChange={(e) => handleEditChange('date_of_joining', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Employee ID</label>
                  <p>{profile.job_details.employee_id}</p>
                </div>
                <div className="detail-item">
                  <label>Designation</label>
                  <p>{profile.job_details.designation}</p>
                </div>
                <div className="detail-item">
                  <label>Department</label>
                  <p>{profile.job_details.department}</p>
                </div>
                <div className="detail-item">
                  <label>Date of Joining</label>
                  <p>{profile.job_details.date_of_joining}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Salary Structure Section */}
        <section className="profile-section">
          <div className="section-header">
            <h3 className="section-title">💰 Salary Structure (Confidential)</h3>
          </div>
          <div className="section-content">
            {isEditMode && userRole === 'admin' ? (
              <div className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Basic Pay</label>
                    <input
                      type="number"
                      value={editData.basic_pay}
                      onChange={(e) => handleEditChange('basic_pay', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Allowances</label>
                    <input
                      type="number"
                      value={editData.allowances}
                      onChange={(e) => handleEditChange('allowances', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Deductions</label>
                    <input
                      type="number"
                      value={editData.deductions}
                      onChange={(e) => handleEditChange('deductions', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Net Salary</label>
                    <input
                      type="number"
                      value={editData.net_salary}
                      onChange={(e) => handleEditChange('net_salary', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="salary-table">
                <div className="salary-row">
                  <span className="salary-label">Basic Pay</span>
                  <span className="salary-value">₹{profile.salary_structure.basic_pay.toLocaleString()}</span>
                </div>
                <div className="salary-row">
                  <span className="salary-label">Allowances</span>
                  <span className="salary-value">₹{profile.salary_structure.allowances.toLocaleString()}</span>
                </div>
                <div className="salary-row">
                  <span className="salary-label">Deductions</span>
                  <span className="salary-value">₹{profile.salary_structure.deductions.toLocaleString()}</span>
                </div>
                <div className="salary-row salary-total">
                  <span className="salary-label">Net Salary</span>
                  <span className="salary-value">₹{profile.salary_structure.net_salary.toLocaleString()}</span>
                </div>
              </div>
            )}
            {!isEditMode && <p className="read-only-notice">* This is read-only information for your reference</p>}
          </div>
        </section>

        {/* Documents Section */}
        {(profile.documents.aadhaar || profile.documents.pan || profile.documents.offer_letter) && (
          <section className="profile-section">
            <div className="section-header">
              <h3 className="section-title">📄 Documents</h3>
            </div>
            <div className="section-content">
              {isEditMode && userRole === 'admin' ? (
                <div className="edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Aadhaar</label>
                      <input
                        type="text"
                        value={editData.aadhaar}
                        onChange={(e) => handleEditChange('aadhaar', e.target.value)}
                        placeholder="XXXX-XXXX-1234"
                      />
                    </div>
                    <div className="form-group">
                      <label>PAN</label>
                      <input
                        type="text"
                        value={editData.pan}
                        onChange={(e) => handleEditChange('pan', e.target.value)}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Offer Letter</label>
                      <input
                        type="text"
                        value={editData.offer_letter}
                        onChange={(e) => handleEditChange('offer_letter', e.target.value)}
                        placeholder="URL or filename"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="documents-grid">
                  {profile.documents.aadhaar && (
                    <div className="document-item">
                      <span className="document-label">Aadhaar</span>
                      <p className="document-value">{profile.documents.aadhaar}</p>
                    </div>
                  )}
                  {profile.documents.pan && (
                    <div className="document-item">
                      <span className="document-label">PAN</span>
                      <p className="document-value">{profile.documents.pan}</p>
                    </div>
                  )}
                  {profile.documents.offer_letter && (
                    <div className="document-item">
                      <span className="document-label">Offer Letter</span>
                      {profile.documents.offer_letter.startsWith('http') ? (
                        <a 
                          href={profile.documents.offer_letter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="document-link"
                        >
                          Download 📥
                        </a>
                      ) : (
                        <p className="document-value">{profile.documents.offer_letter}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Last Updated */}
        {profile.last_updated && (
          <div className="last-updated">
            Last updated: {new Date(profile.last_updated).toLocaleDateString()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="profile-actions">
          {isEditMode ? (
            <div className="edit-actions">
              <button
                className="save-button"
                onClick={handleSaveProfile}
                disabled={updateLoading}
              >
                {updateLoading ? 'Saving...' : '✅ Save Changes'}
              </button>
              <button
                className="cancel-button"
                onClick={handleEditCancel}
                disabled={updateLoading}
              >
                ❌ Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/employee/dashboard')} className="back-button">
              ← Back to Dashboard
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeProfile;
