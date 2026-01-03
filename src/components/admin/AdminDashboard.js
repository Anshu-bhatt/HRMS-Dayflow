import React, { useState, useEffect } from 'react';
import { dashboardService, employeeService, leaveService, attendanceService } from '../../services/firebaseService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    monthlyPayroll: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingLeaves, setUpcomingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const dashboardStats = await dashboardService.getStats();
      setStats(dashboardStats);

      // Fetch recent activities (leaves and attendance)
      const leaves = await leaveService.getAll();
      const activities = leaves.slice(0, 4).map(leave => ({
        id: leave.id,
        type: 'leave',
        employee: leave.employeeName || 'Unknown',
        action: `${leave.status} leave request`,
        time: '2 hours ago'
      }));
      setRecentActivities(activities);

      // Fetch upcoming leaves
      const upcomingData = leaves
        .filter(l => l.status === 'Approved' && new Date(l.startDate) > new Date())
        .slice(0, 3)
        .map(leave => ({
          id: leave.id,
          employee: leave.employeeName || 'Unknown',
          type: leave.leaveType,
          date: leave.startDate,
          days: leave.days
        }));
      setUpcomingLeaves(upcomingData);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const attendanceRate = stats.totalEmployees > 0 
    ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1) 
    : 0;

  return (
    <div className="admin-dashboard">
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Loading dashboard...</div>}
      
      <div className="dashboard-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p className="dashboard-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="dashboard-date">
          <span className="date-icon">📅</span>
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalEmployees}</h3>
            <p>Total Employees</p>
          </div>
          <div className="stat-trend positive">+5 this month</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.presentToday}</h3>
            <p>Present Today</p>
          </div>
          <div className="stat-trend">
            <span className="attendance-rate">{attendanceRate}% attendance</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.pendingLeaves}</h3>
            <p>Pending Leave Requests</p>
          </div>
          <div className="stat-trend warning">Needs attention</div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>₹{(stats.monthlyPayroll / 100000).toFixed(1)}L</h3>
            <p>Monthly Payroll</p>
          </div>
          <div className="stat-trend">This month</div>
        </div>
      </div>

      {/* Charts and Activities */}
      <div className="dashboard-grid">
        {/* Recent Activities */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Activities</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activities-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.type === 'leave' && '✈️'}
                  {activity.type === 'attendance' && '📅'}
                  {activity.type === 'employee' && '👤'}
                </div>
                <div className="activity-content">
                  <p className="activity-employee">{activity.employee}</p>
                  <p className="activity-action">{activity.action}</p>
                </div>
                <span className="activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Leaves */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Upcoming Leaves</h2>
            <button className="view-all-btn">View Calendar</button>
          </div>
          <div className="leaves-list">
            {upcomingLeaves.map((leave) => (
              <div key={leave.id} className="leave-item">
                <div className="leave-info">
                  <p className="leave-employee">{leave.employee}</p>
                  <p className="leave-type">{leave.type}</p>
                </div>
                <div className="leave-details">
                  <span className="leave-date">{new Date(leave.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="leave-days">{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-btn purple">
            <span className="action-icon">➕</span>
            <span>Add Employee</span>
          </button>
          <button className="action-btn blue">
            <span className="action-icon">📊</span>
            <span>Generate Report</span>
          </button>
          <button className="action-btn orange">
            <span className="action-icon">✅</span>
            <span>Approve Leaves</span>
          </button>
          <button className="action-btn green">
            <span className="action-icon">💵</span>
            <span>Process Payroll</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
