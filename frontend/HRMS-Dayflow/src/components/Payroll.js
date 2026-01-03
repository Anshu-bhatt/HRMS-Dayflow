import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Payroll.css';

const Payroll = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      fetchPayroll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPayroll = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken(true);
      
      const response = await fetch('http://localhost:8000/payroll/my', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch payroll');
      }

      const data = await response.json();
      setPayroll(data);
    } catch (err) {
      console.error('Error fetching payroll:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not updated yet';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="payroll-container">
      <header className="payroll-header">
        <button className="back-button" onClick={() => navigate('/employee/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>💰 My Payroll</h1>
      </header>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading payroll details...</p>
        </div>
      ) : payroll ? (
        <div className="payroll-content">
          {/* Salary Overview Card */}
          <div className="salary-overview-card">
            <div className="overview-header">
              <h2>Salary Overview</h2>
              <span className="pay-cycle-badge">{payroll.pay_cycle}</span>
            </div>
            
            <div className="net-salary-display">
              <span className="net-label">Net Salary</span>
              <span className="net-amount">{formatCurrency(payroll.net_salary)}</span>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="salary-breakdown-card">
            <h2>Salary Breakdown</h2>
            
            <div className="breakdown-list">
              {/* Earnings Section */}
              <div className="breakdown-section">
                <h3 className="section-title earnings">📈 Earnings</h3>
                
                <div className="breakdown-item">
                  <div className="item-info">
                    <span className="item-label">Basic Pay</span>
                    <span className="item-description">Base salary component</span>
                  </div>
                  <span className="item-amount positive">{formatCurrency(payroll.basic_pay)}</span>
                </div>
                
                <div className="breakdown-item">
                  <div className="item-info">
                    <span className="item-label">Allowances</span>
                    <span className="item-description">HRA, DA, Travel, etc.</span>
                  </div>
                  <span className="item-amount positive">{formatCurrency(payroll.allowances)}</span>
                </div>
                
                <div className="breakdown-subtotal">
                  <span>Gross Earnings</span>
                  <span>{formatCurrency(payroll.basic_pay + payroll.allowances)}</span>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="breakdown-section">
                <h3 className="section-title deductions">📉 Deductions</h3>
                
                <div className="breakdown-item">
                  <div className="item-info">
                    <span className="item-label">Total Deductions</span>
                    <span className="item-description">PF, Tax, Insurance, etc.</span>
                  </div>
                  <span className="item-amount negative">- {formatCurrency(payroll.deductions)}</span>
                </div>
              </div>

              {/* Net Salary */}
              <div className="breakdown-total">
                <span>Net Salary (Take Home)</span>
                <span>{formatCurrency(payroll.net_salary)}</span>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="info-card">
            <div className="info-icon">ℹ️</div>
            <div className="info-content">
              <p><strong>Note:</strong> This is a read-only view of your salary structure.</p>
              <p>For any queries or discrepancies, please contact HR.</p>
              {payroll.updated_at && (
                <p className="last-updated">Last updated: {formatDate(payroll.updated_at)}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <h3>Payroll Not Set Up</h3>
          <p>Your payroll details have not been configured yet.</p>
          <p>Please contact HR for assistance.</p>
        </div>
      )}
    </div>
  );
};

export default Payroll;
