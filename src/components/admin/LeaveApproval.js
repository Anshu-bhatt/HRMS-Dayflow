import React, { useState, useEffect } from 'react';
import { leaveService, employeeService } from '../../services/firebaseService';
import './LeaveApproval.css';

const LeaveApproval = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'pending';
      case 'Approved':
        return 'approved';
      case 'Rejected':
        return 'rejected';
      default:
        return '';
    }
  };

  const getLeaveTypeIcon = (type) => {
    switch (type) {
      case 'Paid Leave':
        return '✈️';
      case 'Sick Leave':
        return '🏥';
      case 'Unpaid Leave':
        return '⏰';
      default:
        return '📋';
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leaves, emps] = await Promise.all([
        leaveService.getAll(),
        employeeService.getAll()
      ]);
      setLeaveRequests(leaves);
      setEmployees(emps);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaves = leaveRequests.filter((leave) => {
    if (filterStatus === 'all') return true;
    return leave.status === filterStatus;
  });

  const stats = {
    pending: leaveRequests.filter((l) => l.status === 'Pending').length,
    approved: leaveRequests.filter((l) => l.status === 'Approved').length,
    rejected: leaveRequests.filter((l) => l.status === 'Rejected').length,
  };

  const handleApprove = async (leaveId) => {
    try {
      await leaveService.updateStatus(leaveId, 'Approved');
      await fetchData();
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Error approving leave:', err);
      alert('Failed to approve leave');
    }
  };

  const handleReject = async (leaveId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await leaveService.updateStatus(leaveId, 'Rejected', reason);
        await fetchData();
        setShowDetailsModal(false);
      } catch (err) {
        console.error('Error rejecting leave:', err);
        alert('Failed to reject leave');
      }
    }
  };

  return (
    <div className="leave-approval">
      {error && <div className="error-message">{error}</div>}

      <div className="page-header">
        <div>
          <h1>Leave Requests</h1>
          <p className="page-subtitle">Review and manage employee leave applications</p>
        </div>
      </div>

      <div className="leave-stats">
        <div className="stat-card pending">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Requests</p>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>

        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{leaveRequests.length}</h3>
            <p>Total Requests</p>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filterStatus === 'all' ? 'active' : ''}
          onClick={() => setFilterStatus('all')}
        >
          All Requests ({leaveRequests.length})
        </button>
        <button
          className={filterStatus === 'Pending' ? 'active' : ''}
          onClick={() => setFilterStatus('Pending')}
        >
          Pending ({stats.pending})
        </button>
        <button
          className={filterStatus === 'Approved' ? 'active' : ''}
          onClick={() => setFilterStatus('Approved')}
        >
          Approved ({stats.approved})
        </button>
        <button
          className={filterStatus === 'Rejected' ? 'active' : ''}
          onClick={() => setFilterStatus('Rejected')}
        >
          Rejected ({stats.rejected})
        </button>
      </div>

      <div className="leave-requests-list">
        {loading ? (
          <div className="loading-message">Loading leave requests...</div>
        ) : filteredLeaves.length > 0 ? (
          filteredLeaves.map((leave) => (
            <div key={leave.id} className="leave-request-card">
              <div className="leave-card-header">
                <div className="employee-info">
                  <div className="employee-avatar">
                    {employees.find(e => e.id === leave.employeeId)?.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('') || 'N/A'}
                  </div>
                  <div>
                    <div className="employee-name">
                      {employees.find(e => e.id === leave.employeeId)?.name || 'Unknown'}
                    </div>
                    <div className="employee-details">
                      {leave.employeeId} • {employees.find(e => e.id === leave.employeeId)?.department || 'N/A'}
                    </div>
                  </div>
                </div>
                <span className={`status-badge ${getStatusColor(leave.status)}`}>
                  {leave.status}
                </span>
              </div>

              <div className="leave-card-body">
                <div className="leave-info-grid">
                  <div className="info-item">
                    <span className="info-label">Leave Type</span>
                    <span className="info-value">
                      {getLeaveTypeIcon(leave.leaveType)} {leave.leaveType}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Duration</span>
                    <span className="info-value">{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Start Date</span>
                    <span className="info-value">
                      {new Date(leave.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">End Date</span>
                    <span className="info-value">
                      {new Date(leave.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="leave-reason">
                  <span className="reason-label">Reason:</span>
                  <p>{leave.reason}</p>
                </div>
              </div>

              <div className="leave-card-footer">
                <span className="applied-date">
                  Applied on {new Date(leave.appliedOn).toLocaleDateString()}
                </span>
                <div className="action-buttons">
                  <button className="btn-view" onClick={() => {
                    setSelectedLeave(leave);
                    setShowDetailsModal(true);
                  }}>
                    View Details
                  </button>
                  {leave.status === 'Pending' && (
                    <>
                      <button className="btn-approve" onClick={() => handleApprove(leave.id)}>
                        ✓ Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleReject(leave.id)}
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-message">No leave requests found</div>
        )}
      </div>

      {showDetailsModal && selectedLeave && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content leave-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Leave Request Details</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Employee Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">
                      {employees.find(e => e.id === selectedLeave.employeeId)?.name || 'Unknown'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{selectedLeave.employeeId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">
                      {employees.find(e => e.id === selectedLeave.employeeId)?.department || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Leave Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Leave Type:</span>
                    <span className="detail-value">
                      {getLeaveTypeIcon(selectedLeave.leaveType)} {selectedLeave.leaveType}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{selectedLeave.days} days</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">From:</span>
                    <span className="detail-value">
                      {new Date(selectedLeave.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">To:</span>
                    <span className="detail-value">
                      {new Date(selectedLeave.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Reason:</span>
                    <span className="detail-value">{selectedLeave.reason}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Request Status</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${getStatusColor(selectedLeave.status)}`}>
                      {selectedLeave.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Applied On:</span>
                    <span className="detail-value">
                      {new Date(selectedLeave.appliedOn).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedLeave.status === 'Pending' && (
              <div className="modal-footer">
                <button
                  className="btn-reject"
                  onClick={() => handleReject(selectedLeave.id)}
                >
                  ✕ Reject Request
                </button>
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(selectedLeave.id)}
                >
                  ✓ Approve Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApproval;
