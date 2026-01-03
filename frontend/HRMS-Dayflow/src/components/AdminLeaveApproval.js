import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLeaveApproval.css';

const AdminLeaveApproval = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState('Pending');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' | 'reject'
  const [adminComment, setAdminComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch leaves on mount and filter change
  useEffect(() => {
    if (user?.uid) {
      fetchLeaves();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filterStatus]);

  const fetchLeaves = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken(true);
      
      const url = filterStatus 
        ? `http://localhost:8000/leave/all?status=${filterStatus}`
        : 'http://localhost:8000/leave/all';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch leave requests');
      }

      const data = await response.json();
      setLeaves(data.leaves || []);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (leave, action) => {
    setSelectedLeave(leave);
    setActionType(action);
    setAdminComment('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLeave(null);
    setActionType('');
    setAdminComment('');
  };

  const handleAction = async () => {
    if (!selectedLeave || !actionType) return;

    setActionLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken(true);
      
      const response = await fetch(`http://localhost:8000/leave/${selectedLeave.leave_id}/${actionType}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_comment: adminComment.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to ${actionType} leave`);
      }

      setSuccess(`Leave ${actionType}d successfully!`);
      closeModal();
      fetchLeaves();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(`Error ${actionType}ing leave:`, err);
      setError(err.message);
    } finally {
      setActionLoading(false);
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

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="admin-leave-container">
      <header className="admin-leave-header">
        <button className="back-button" onClick={() => navigate('/admin/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>Leave Approval</h1>
      </header>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filterStatus === 'Pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('Pending')}
        >
          ⏳ Pending
        </button>
        <button 
          className={`filter-tab ${filterStatus === 'Approved' ? 'active' : ''}`}
          onClick={() => setFilterStatus('Approved')}
        >
          ✅ Approved
        </button>
        <button 
          className={`filter-tab ${filterStatus === 'Rejected' ? 'active' : ''}`}
          onClick={() => setFilterStatus('Rejected')}
        >
          ❌ Rejected
        </button>
        <button 
          className={`filter-tab ${filterStatus === '' ? 'active' : ''}`}
          onClick={() => setFilterStatus('')}
        >
          📋 All
        </button>
      </div>

      {/* Messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Leave Requests List */}
      <div className="leave-requests-card">
        <div className="requests-header">
          <h2>
            {filterStatus ? `${filterStatus} Requests` : 'All Requests'} 
            <span className="count-badge">{leaves.length}</span>
          </h2>
          <button 
            className="refresh-button"
            onClick={fetchLeaves}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading leave requests...</div>
        ) : leaves.length === 0 ? (
          <div className="empty-state">
            <p>No {filterStatus?.toLowerCase() || ''} leave requests found.</p>
          </div>
        ) : (
          <div className="leave-table-container">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Days</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.leave_id}>
                    <td>
                      <div className="employee-info">
                        <span className="employee-name">{leave.user_name || 'Unknown'}</span>
                        <span className="employee-email">{leave.user_email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={getLeaveTypeBadgeClass(leave.leave_type)}>
                        {leave.leave_type}
                      </span>
                    </td>
                    <td>
                      <div className="date-range">
                        <span>{formatDate(leave.start_date)}</span>
                        <span className="date-arrow">→</span>
                        <span>{formatDate(leave.end_date)}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{calculateDays(leave.start_date, leave.end_date)}</strong>
                    </td>
                    <td>
                      <span className="remarks-text">
                        {leave.remarks || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(leave.status)}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      {leave.status === 'Pending' ? (
                        <div className="action-buttons">
                          <button 
                            className="approve-btn"
                            onClick={() => openActionModal(leave, 'approve')}
                          >
                            ✅ Approve
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={() => openActionModal(leave, 'reject')}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="action-done">
                          {leave.admin_comment && (
                            <span className="comment-indicator" title={leave.admin_comment}>
                              💬
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedLeave && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {actionType === 'approve' ? '✅ Approve Leave' : '❌ Reject Leave'}
              </h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="leave-summary">
                <p><strong>Employee:</strong> {selectedLeave.user_name}</p>
                <p><strong>Type:</strong> {selectedLeave.leave_type}</p>
                <p><strong>Duration:</strong> {formatDate(selectedLeave.start_date)} to {formatDate(selectedLeave.end_date)}</p>
                <p><strong>Days:</strong> {calculateDays(selectedLeave.start_date, selectedLeave.end_date)}</p>
                {selectedLeave.remarks && (
                  <p><strong>Remarks:</strong> {selectedLeave.remarks}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="adminComment">
                  Comment (Optional)
                </label>
                <textarea 
                  id="adminComment"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder={actionType === 'approve' 
                    ? 'Add any notes for approval...' 
                    : 'Please provide a reason for rejection...'}
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeModal} disabled={actionLoading}>
                Cancel
              </button>
              <button 
                className={actionType === 'approve' ? 'confirm-approve-btn' : 'confirm-reject-btn'}
                onClick={handleAction}
                disabled={actionLoading}
              >
                {actionLoading 
                  ? 'Processing...' 
                  : actionType === 'approve' ? 'Approve Leave' : 'Reject Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveApproval;
