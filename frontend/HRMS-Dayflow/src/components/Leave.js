import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Leave.css';

const Leave = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for apply leave form
  const [leaveType, setLeaveType] = useState('Paid');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // State for leave history
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // View toggle
  const [activeView, setActiveView] = useState('apply'); // 'apply' | 'history'

  // Fetch leave history on mount
  useEffect(() => {
    if (user?.uid) {
      fetchLeaveHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchLeaveHistory = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken(true);
      
      const response = await fetch('http://localhost:8000/leave/my', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch leave history');
      }

      const data = await response.json();
      setLeaves(data.leaves || []);
    } catch (err) {
      console.error('Error fetching leave history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date');
      return;
    }

    setSubmitting(true);

    try {
      const idToken = await user.getIdToken(true);
      
      const response = await fetch('http://localhost:8000/leave/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          remarks: remarks.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to apply for leave');
      }

      setSuccess('Leave application submitted successfully!');
      // Reset form
      setStartDate('');
      setEndDate('');
      setRemarks('');
      // Refresh history
      fetchLeaveHistory();
      
      // Auto-switch to history view after 2 seconds
      setTimeout(() => {
        setActiveView('history');
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error applying for leave:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved': return 'status-badge approved';
      case 'Rejected': return 'status-badge rejected';
      case 'Pending': return 'status-badge pending';
      default: return 'status-badge';
    }
  };

  const getLeaveTypeBadgeClass = (type) => {
    switch (type) {
      case 'Paid': return 'leave-type-badge paid';
      case 'Sick': return 'leave-type-badge sick';
      case 'Unpaid': return 'leave-type-badge unpaid';
      default: return 'leave-type-badge';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Get today's date for min date in date picker
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="leave-container">
      <header className="leave-header">
        <button className="back-button" onClick={() => navigate('/employee/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Leave Management</h1>
      </header>

      {/* Tab Navigation */}
      <div className="leave-tabs">
        <button 
          className={`tab-button ${activeView === 'apply' ? 'active' : ''}`}
          onClick={() => setActiveView('apply')}
        >
          📝 Apply for Leave
        </button>
        <button 
          className={`tab-button ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveView('history'); fetchLeaveHistory(); }}
        >
          📋 Leave History ({leaves.length})
        </button>
      </div>

      {/* Messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Apply Leave Form */}
      {activeView === 'apply' && (
        <div className="apply-leave-card">
          <h2>Apply for Leave</h2>
          <form onSubmit={handleApplyLeave} className="leave-form">
            <div className="form-group">
              <label htmlFor="leaveType">Leave Type</label>
              <select 
                id="leaveType"
                value={leaveType} 
                onChange={(e) => setLeaveType(e.target.value)}
                required
              >
                <option value="Paid">🏖️ Paid Leave</option>
                <option value="Sick">🏥 Sick Leave</option>
                <option value="Unpaid">📅 Unpaid Leave</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input 
                  type="date" 
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input 
                  type="date" 
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  required
                />
              </div>
            </div>

            {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
              <div className="leave-duration">
                📅 Duration: <strong>{calculateDays(startDate, endDate)} day(s)</strong>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="remarks">Remarks (Optional)</label>
              <textarea 
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter reason for leave..."
                rows="3"
              />
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </div>
      )}

      {/* Leave History */}
      {activeView === 'history' && (
        <div className="leave-history-card">
          <div className="history-header">
            <h2>Leave History</h2>
            <button 
              className="refresh-button"
              onClick={fetchLeaveHistory}
              disabled={loading}
            >
              {loading ? '🔄' : '🔄 Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="loading-state">Loading leave history...</div>
          ) : leaves.length === 0 ? (
            <div className="empty-state">
              <p>No leave requests found.</p>
              <button onClick={() => setActiveView('apply')} className="apply-now-button">
                Apply for Leave
              </button>
            </div>
          ) : (
            <div className="leave-list">
              {leaves.map((leave) => (
                <div key={leave.leave_id} className="leave-card">
                  <div className="leave-card-header">
                    <span className={getLeaveTypeBadgeClass(leave.leave_type)}>
                      {leave.leave_type}
                    </span>
                    <span className={getStatusBadgeClass(leave.status)}>
                      {leave.status}
                    </span>
                  </div>
                  <div className="leave-card-body">
                    <div className="leave-dates">
                      <span className="date-label">From:</span>
                      <span className="date-value">{formatDate(leave.start_date)}</span>
                      <span className="date-label">To:</span>
                      <span className="date-value">{formatDate(leave.end_date)}</span>
                      <span className="date-label">Days:</span>
                      <span className="date-value">{calculateDays(leave.start_date, leave.end_date)}</span>
                    </div>
                    {leave.remarks && (
                      <div className="leave-remarks">
                        <strong>Remarks:</strong> {leave.remarks}
                      </div>
                    )}
                    {leave.admin_comment && (
                      <div className="admin-comment">
                        <strong>Admin Comment:</strong> {leave.admin_comment}
                      </div>
                    )}
                  </div>
                  <div className="leave-card-footer">
                    Applied on: {formatDate(leave.created_at?.split('T')[0])}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leave;
