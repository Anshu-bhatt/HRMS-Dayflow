import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminPayroll.css';

const AdminPayroll = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    basic_pay: 0,
    allowances: 0,
    deductions: 0,
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchPayrollData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPayrollData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken(true);
      
      const response = await fetch('http://localhost:8000/payroll/all', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch payroll data');
      }

      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Error fetching payroll:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      basic_pay: employee.basic_pay || 0,
      allowances: employee.allowances || 0,
      deductions: employee.deductions || 0,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
    setFormData({ basic_pay: 0, allowances: 0, deductions: 0 });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const calculateNetSalary = () => {
    return formData.basic_pay + formData.allowances - formData.deductions;
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;

    setUpdating(true);
    setError(null);

    try {
      const idToken = await user.getIdToken(true);
      
      const response = await fetch(`http://localhost:8000/payroll/${selectedEmployee.user_id}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update payroll');
      }

      setSuccess(`Payroll updated for ${selectedEmployee.user_name}!`);
      closeModal();
      fetchPayrollData();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating payroll:', err);
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Calculate total payroll
  const totalPayroll = employees.reduce((sum, emp) => sum + (emp.net_salary || 0), 0);

  return (
    <div className="admin-payroll-container">
      <header className="admin-payroll-header">
        <button className="back-button" onClick={() => navigate('/admin/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>💰 Payroll Management</h1>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Employees</span>
          <span className="summary-value">{employees.length}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Monthly Payroll</span>
          <span className="summary-value">{formatCurrency(totalPayroll)}</span>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Employee Payroll List */}
      <div className="payroll-list-card">
        <div className="list-header">
          <h2>Employee Salary Structure</h2>
          <button 
            className="refresh-button"
            onClick={fetchPayrollData}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading payroll data...</div>
        ) : employees.length === 0 ? (
          <div className="empty-state">
            <p>No employees found.</p>
          </div>
        ) : (
          <div className="payroll-table-container">
            <table className="payroll-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Basic Pay</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.user_id}>
                    <td>
                      <div className="employee-info">
                        <span className="employee-name">{employee.user_name || 'Not Set'}</span>
                        <span className="employee-email">{employee.user_email}</span>
                      </div>
                    </td>
                    <td className="amount-cell">
                      {formatCurrency(employee.basic_pay)}
                    </td>
                    <td className="amount-cell positive">
                      +{formatCurrency(employee.allowances)}
                    </td>
                    <td className="amount-cell negative">
                      -{formatCurrency(employee.deductions)}
                    </td>
                    <td className="amount-cell net">
                      {formatCurrency(employee.net_salary)}
                    </td>
                    <td>
                      <button 
                        className="edit-button"
                        onClick={() => openEditModal(employee)}
                      >
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showModal && selectedEmployee && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Payroll</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="employee-summary">
                <strong>{selectedEmployee.user_name}</strong>
                <span>{selectedEmployee.user_email}</span>
              </div>

              <div className="form-group">
                <label htmlFor="basic_pay">Basic Pay (₹)</label>
                <input 
                  type="number"
                  id="basic_pay"
                  name="basic_pay"
                  value={formData.basic_pay}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="allowances">Allowances (₹)</label>
                <input 
                  type="number"
                  id="allowances"
                  name="allowances"
                  value={formData.allowances}
                  onChange={handleInputChange}
                  min="0"
                  step="500"
                />
                <span className="field-hint">HRA, DA, Travel, etc.</span>
              </div>

              <div className="form-group">
                <label htmlFor="deductions">Deductions (₹)</label>
                <input 
                  type="number"
                  id="deductions"
                  name="deductions"
                  value={formData.deductions}
                  onChange={handleInputChange}
                  min="0"
                  step="500"
                />
                <span className="field-hint">PF, Tax, Insurance, etc.</span>
              </div>

              <div className="calculated-salary">
                <span>Net Salary (Auto-calculated)</span>
                <span className="net-value">{formatCurrency(calculateNetSalary())}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeModal} disabled={updating}>
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayroll;
