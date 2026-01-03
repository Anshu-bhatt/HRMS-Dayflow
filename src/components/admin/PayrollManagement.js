import React, { useState, useEffect } from 'react';
import { payrollService, employeeService } from '../../services/firebaseService';
import './PayrollManagement.css';

const PayrollManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [salaryForm, setSalaryForm] = useState({
    baseSalary: '',
    allowances: '',
    deductions: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payroll, emps] = await Promise.all([
        payrollService.getAll(),
        employeeService.getAll()
      ]);
      setPayrollData(payroll);
      setEmployees(emps);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayroll = payrollData.filter((emp) =>
    employees.find(e => e.id === emp.employeeId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employees.find(e => e.id === emp.employeeId)?.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalPayroll: payrollData.reduce((sum, emp) => sum + emp.netSalary, 0),
    averageSalary: Math.round(
      payrollData.length > 0 ? payrollData.reduce((sum, emp) => sum + emp.netSalary, 0) / payrollData.length : 0
    ),
    pending: payrollData.filter((emp) => emp.paymentStatus === 'Pending').length,
    paid: payrollData.filter((emp) => emp.paymentStatus === 'Paid').length,
  };

  const handleEditSalary = (employee) => {
    setSelectedEmployee(employee);
    const payroll = payrollData.find(p => p.employeeId === employee.id);
    if (payroll) {
      setSalaryForm({
        baseSalary: payroll.baseSalary,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
      });
    }
    setShowEditModal(true);
  };

  const handleUpdateSalary = async () => {
    try {
      const netSalary =
        parseInt(salaryForm.baseSalary) +
        parseInt(salaryForm.allowances) -
        parseInt(salaryForm.deductions);

      const payroll = payrollData.find(p => p.employeeId === selectedEmployee.id);
      if (payroll) {
        await payrollService.update(payroll.id, {
          baseSalary: parseInt(salaryForm.baseSalary),
          allowances: parseInt(salaryForm.allowances),
          deductions: parseInt(salaryForm.deductions),
          netSalary,
        });
      }

      setShowEditModal(false);
      await fetchData();
    } catch (err) {
      console.error('Error updating salary:', err);
      alert('Failed to update salary');
    }
  };

  const handleMarkPaid = async (payrollId) => {
    try {
      await payrollService.markAsPaid(payrollId);
      await fetchData();
    } catch (err) {
      console.error('Error marking as paid:', err);
      alert('Failed to mark as paid');
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="payroll-management">
      {error && <div className="error-message">{error}</div>}

      <div className="page-header">
        <div>
          <h1>Payroll Management</h1>
          <p className="page-subtitle">Manage employee salaries and payment records</p>
        </div>
        <button className="generate-report-btn">📊 Generate Report</button>
      </div>

      <div className="payroll-stats">
        <div className="stat-card purple">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalPayroll)}</h3>
            <p>Total Monthly Payroll</p>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.averageSalary)}</h3>
            <p>Average Salary</p>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Payments</p>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.paid}</h3>
            <p>Paid This Month</p>
          </div>
        </div>
      </div>

      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="payroll-table-container">
        {loading ? (
          <div className="loading-message">Loading payroll data...</div>
        ) : (
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Base Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Last Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayroll.length > 0 ? (
                filteredPayroll.map((payroll) => {
                  const emp = employees.find(e => e.id === payroll.employeeId);
                  return (
                    <tr key={payroll.id}>
                      <td>
                        <div className="employee-info">
                          <div className="employee-avatar">
                            {emp?.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('') || 'N/A'}
                          </div>
                          <div>
                            <div className="employee-name">{emp?.name || 'Unknown'}</div>
                            <div className="employee-details">
                              {payroll.employeeId} • {emp?.position || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="salary-amount">{formatCurrency(payroll.baseSalary)}</span>
                      </td>
                      <td>
                        <span className="allowance-amount positive">
                          +{formatCurrency(payroll.allowances)}
                        </span>
                      </td>
                      <td>
                        <span className="deduction-amount negative">
                          -{formatCurrency(payroll.deductions)}
                        </span>
                      </td>
                      <td>
                        <span className="net-salary">{formatCurrency(payroll.netSalary)}</span>
                      </td>
                      <td>
                        <span
                          className={`payment-status ${payroll.paymentStatus.toLowerCase()}`}
                        >
                          {payroll.paymentStatus}
                        </span>
                      </td>
                      <td>{new Date(payroll.lastPaid).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditSalary(emp)}
                            title="Edit Salary"
                          >
                            ✏️
                          </button>
                          {payroll.paymentStatus === 'Pending' && (
                            <button
                              className="btn-pay"
                              onClick={() => handleMarkPaid(payroll.id)}
                              title="Mark as Paid"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="empty-message">
                    No payroll records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="salary-breakdown">
        <h2>Salary Breakdown Overview</h2>
        <div className="breakdown-grid">
          <div className="breakdown-card">
            <div className="breakdown-header">
              <span className="breakdown-icon">💵</span>
              <span className="breakdown-title">Total Base Salaries</span>
            </div>
            <div className="breakdown-amount">
              {formatCurrency(payrollData.reduce((sum, emp) => sum + emp.baseSalary, 0))}
            </div>
          </div>

          <div className="breakdown-card">
            <div className="breakdown-header">
              <span className="breakdown-icon">➕</span>
              <span className="breakdown-title">Total Allowances</span>
            </div>
            <div className="breakdown-amount positive">
              {formatCurrency(payrollData.reduce((sum, emp) => sum + emp.allowances, 0))}
            </div>
          </div>

          <div className="breakdown-card">
            <div className="breakdown-header">
              <span className="breakdown-icon">➖</span>
              <span className="breakdown-title">Total Deductions</span>
            </div>
            <div className="breakdown-amount negative">
              {formatCurrency(payrollData.reduce((sum, emp) => sum + emp.deductions, 0))}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Salary Structure</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="employee-preview">
                <div className="employee-avatar-large">
                  {selectedEmployee.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3>{selectedEmployee.name}</h3>
                  <p>
                    {selectedEmployee.id} • {selectedEmployee.position}
                  </p>
                </div>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label>Base Salary *</label>
                  <input
                    type="number"
                    value={salaryForm.baseSalary}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, baseSalary: e.target.value })
                    }
                    placeholder="Enter base salary"
                  />
                </div>

                <div className="form-group">
                  <label>Allowances</label>
                  <input
                    type="number"
                    value={salaryForm.allowances}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, allowances: e.target.value })
                    }
                    placeholder="Enter allowances"
                  />
                </div>

                <div className="form-group">
                  <label>Deductions</label>
                  <input
                    type="number"
                    value={salaryForm.deductions}
                    onChange={(e) =>
                      setSalaryForm({ ...salaryForm, deductions: e.target.value })
                    }
                    placeholder="Enter deductions"
                  />
                </div>

                <div className="net-salary-preview">
                  <span>Net Salary:</span>
                  <strong>
                    {formatCurrency(
                      parseInt(salaryForm.baseSalary || 0) +
                        parseInt(salaryForm.allowances || 0) -
                        parseInt(salaryForm.deductions || 0)
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleUpdateSalary}>
                Update Salary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
