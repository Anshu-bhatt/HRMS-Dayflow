import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Attendance.css';

const Attendance = () => {
  const navigate = useNavigate();
  const { user, logout, userRole } = useAuth();

  // State management
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [viewMode, setViewMode] = useState('today'); // 'today', 'daily', 'weekly', 'all'
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  // Fetch today's attendance
  useEffect(() => {
    if (user) {
      fetchTodayAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTodayAttendance = async () => {
    if (!user || !user.uid) {
      console.log('User not authenticated, skipping fetch');
      return;
    }
    try {
      console.log('Fetching today\'s attendance...');
      let idToken;
      try {
        console.log('Requesting Firebase token for user:', user.uid);
        idToken = await user.getIdToken(true); // forceRefresh = true
        console.log('Token obtained for attendance fetch');
        console.log('Token length:', idToken.length);
      } catch (tokenErr) {
        console.error('Token error:', tokenErr);
        throw new Error('Failed to get authentication token');
      }
      
      if (!idToken) {
        throw new Error('No authentication token available');
      }

      console.log('Token obtained, calling attendance API');
      const response = await fetch(`http://localhost:8000/attendance/my?start_date=${today}&end_date=${today}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Attendance response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', response.status, errorData);
        throw new Error(errorData.detail || `Failed to fetch attendance (${response.status})`);
      }

      const data = await response.json();
      setTodayAttendance(data.records[0] || null);
      console.log('Today\'s attendance fetched:', data);
    } catch (err) {
      console.error('Error fetching today\'s attendance:', err);
      setError(err.message || 'Failed to fetch today\'s attendance');
    }
  };

  const handleCheckIn = async () => {
    if (!user || !user.uid) {
      setError('User not authenticated. Please log in again.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let idToken;
      try {
        idToken = await user.getIdToken(true); // forceRefresh = true
      } catch (tokenErr) {
        console.error('Token error:', tokenErr);
        throw new Error('Failed to get authentication token. Please refresh the page.');
      }

      if (!idToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('http://localhost:8000/attendance/check-in', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: today }),
      });

      console.log('Check-in response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', response.status, errorData);
        throw new Error(errorData.detail || `Check-in failed (${response.status})`);
      }

      const data = await response.json();
      setTodayAttendance(data);
      setMessage('✅ Check-in successful!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Check-in error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !user.uid) {
      setError('User not authenticated. Please log in again.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let idToken;
      try {
        idToken = await user.getIdToken(true); // forceRefresh = true
      } catch (tokenErr) {
        console.error('Token error:', tokenErr);
        throw new Error('Failed to get authentication token. Please refresh the page.');
      }

      if (!idToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('http://localhost:8000/attendance/check-out', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: today }),
      });

      console.log('Check-out response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', response.status, errorData);
        throw new Error(errorData.detail || `Check-out failed (${response.status})`);
      }

      const data = await response.json();
      setTodayAttendance(data);
      setMessage('✅ Check-out successful!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Check-out error:', err);
      setError(err.message || 'Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async (days = 30) => {
    if (!user || !user.uid) {
      console.log('User not authenticated, skipping history fetch');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      let idToken;
      try {
        idToken = await user.getIdToken(true); // forceRefresh = true
      } catch (tokenErr) {
        console.error('Token error:', tokenErr);
        throw new Error('Failed to get authentication token');
      }

      if (!idToken) {
        throw new Error('No authentication token available');
      }

      console.log(`Fetching attendance from ${start} to ${end}`);
      const response = await fetch(`http://localhost:8000/attendance/my?start_date=${start}&end_date=${end}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('History response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', response.status, errorData);
        throw new Error(errorData.detail || `Failed to fetch attendance history (${response.status})`);
      }

      const data = await response.json();
      setAttendanceHistory(data.records || []);
      console.log('History fetched:', data.records.length, 'records');
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAttendance = async () => {
    if (!user || !user.uid) {
      console.log('User not authenticated, skipping all attendance fetch');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let idToken;
      try {
        idToken = await user.getIdToken(true); // forceRefresh = true
      } catch (tokenErr) {
        console.error('Token error:', tokenErr);
        throw new Error('Failed to get authentication token');
      }

      if (!idToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('http://localhost:8000/attendance/all', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('All attendance response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error:', response.status, errorData);
        throw new Error(errorData.detail || `Failed to fetch all attendance (${response.status})`);
      }

      const data = await response.json();
      setAttendanceHistory(data);
      console.log('All attendance fetched:', data.employees?.length || 0, 'employees');
    } catch (err) {
      console.error('Error fetching all attendance:', err);
      setError(err.message || 'Failed to fetch all attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChange = (mode) => {
    setViewMode(mode);
    setError(null);

    if (mode === 'daily') {
      fetchAttendanceHistory(30);
    } else if (mode === 'weekly') {
      fetchAttendanceHistory(7);
    } else if (mode === 'all' && userRole === 'admin') {
      fetchAllAttendance();
    }
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
  };

  // Render today's view
  if (viewMode === 'today') {
    return (
      <div className="attendance-container">
        <header className="attendance-header">
          <h1>Attendance Management</h1>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </header>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">⚠️ {error}</div>}

        <main className="attendance-main">
          {/* Today's Status Card */}
          <section className="today-section">
            <div className="status-card">
              <h2>Today's Attendance</h2>
              <div className="date-display">{new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

              <div className="status-info">
                <div className="info-item">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${todayAttendance?.status.toLowerCase()}`}>
                    {todayAttendance?.status || 'Not Marked'}
                  </span>
                </div>

                <div className="info-item">
                  <span className="label">Check-in:</span>
                  <span className="time">{todayAttendance?.check_in || '—'}</span>
                </div>

                <div className="info-item">
                  <span className="label">Check-out:</span>
                  <span className="time">{todayAttendance?.check_out || '—'}</span>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="check-in-button"
                  onClick={handleCheckIn}
                  disabled={loading || !!todayAttendance?.check_in}
                  title={todayAttendance?.check_in ? 'Already checked in' : 'Record your check-in time'}
                >
                  {loading ? 'Processing...' : '📥 Check In'}
                </button>

                <button
                  className="check-out-button"
                  onClick={handleCheckOut}
                  disabled={loading || !todayAttendance?.check_in || !!todayAttendance?.check_out}
                  title={!todayAttendance?.check_in ? 'Check in first' : todayAttendance?.check_out ? 'Already checked out' : 'Record your check-out time'}
                >
                  {loading ? 'Processing...' : '📤 Check Out'}
                </button>
              </div>
            </div>
          </section>

          {/* View Options */}
          <section className="view-options">
            <h3>View Options</h3>
            <div className="button-group">
              <button
                className={`view-button ${viewMode === 'today' ? 'active' : ''}`}
                onClick={() => handleViewChange('today')}
              >
                Today
              </button>
              <button
                className={`view-button ${viewMode === 'daily' ? 'active' : ''}`}
                onClick={() => handleViewChange('daily')}
              >
                Daily (30 days)
              </button>
              <button
                className={`view-button ${viewMode === 'weekly' ? 'active' : ''}`}
                onClick={() => handleViewChange('weekly')}
              >
                Weekly (7 days)
              </button>
              {userRole === 'admin' && (
                <button
                  className={`view-button ${viewMode === 'all' ? 'active' : ''}`}
                  onClick={() => handleViewChange('all')}
                >
                  All Employees
                </button>
              )}
            </div>
          </section>

          {/* Back Button */}
          <div className="back-section">
            <button className="back-button" onClick={() => navigate('/employee/dashboard')}>
              ← Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Render daily/weekly view
  if (viewMode === 'daily' || viewMode === 'weekly') {
    return (
      <div className="attendance-container">
        <header className="attendance-header">
          <h1>Attendance - {viewMode === 'daily' ? 'Daily View (30 Days)' : 'Weekly View (7 Days)'}</h1>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </header>

        {error && <div className="error-message">⚠️ {error}</div>}

        <main className="attendance-main">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading attendance records...</p>
            </div>
          ) : attendanceHistory.length === 0 ? (
            <div className="empty-state">
              <p>No attendance records found</p>
            </div>
          ) : (
            <section className="attendance-table-section">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((record, index) => (
                    <tr key={index} className={`status-${record.status.toLowerCase()}`}>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.check_in || '—'}</td>
                      <td>{record.check_out || '—'}</td>
                      <td>
                        <span className={`status-badge ${record.status.toLowerCase()}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* View Options */}
          <section className="view-options">
            <div className="button-group">
              <button
                className="view-button"
                onClick={() => handleViewChange('today')}
              >
                Back to Today
              </button>
              {userRole === 'admin' && (
                <button
                  className="view-button"
                  onClick={() => handleViewChange('all')}
                >
                  All Employees
                </button>
              )}
            </div>
          </section>

          {/* Back Button */}
          <div className="back-section">
            <button className="back-button" onClick={() => navigate('/employee/dashboard')}>
              ← Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Render admin all employees view
  if (viewMode === 'all') {
    const employees = attendanceHistory.employees || [];
    
    return (
      <div className="attendance-container">
        <header className="attendance-header">
          <h1>All Employees Attendance</h1>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </header>

        {error && <div className="error-message">⚠️ {error}</div>}

        <main className="attendance-main">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading attendance data...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="empty-state">
              <p>No attendance records found</p>
            </div>
          ) : (
            <section className="admin-attendance-section">
              <div className="employees-summary">
                <p>Total Employees: <strong>{employees.length}</strong></p>
                <p>Period: {attendanceHistory.start_date} to {attendanceHistory.end_date}</p>
              </div>

              {employees.map((employee) => (
                <div key={employee.user_id} className="employee-attendance-card">
                  <div className="employee-header">
                    <h3>{employee.full_name}</h3>
                    <span className="employee-id">{employee.user_id}</span>
                  </div>

                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.records.map((record, index) => (
                        <tr key={index} className={`status-${record.status.toLowerCase()}`}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{record.check_in || '—'}</td>
                          <td>{record.check_out || '—'}</td>
                          <td>
                            <span className={`status-badge ${record.status.toLowerCase()}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          )}

          {/* View Options */}
          <section className="view-options">
            <div className="button-group">
              <button
                className="view-button"
                onClick={() => handleViewChange('today')}
              >
                Back to Today
              </button>
              <button
                className="view-button"
                onClick={() => handleViewChange('daily')}
              >
                My Attendance
              </button>
            </div>
          </section>

          {/* Back Button */}
          <div className="back-section">
            <button className="back-button" onClick={() => navigate('/admin/dashboard')}>
              ← Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }
};

export default Attendance;
