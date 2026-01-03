import React, { useState, useEffect } from 'react';
import { attendanceService, employeeService } from '../../services/firebaseService';
import './AttendanceManagement.css';

const AttendanceManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [viewMode, setViewMode] = useState('daily');
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'present';
      case 'Absent':
        return 'absent';
      case 'Half-Day':
        return 'half-day';
      case 'Leave':
        return 'leave';
      default:
        return '';
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empData, attData] = await Promise.all([
        employeeService.getAll(),
        attendanceService.getAll()
      ]);
      setEmployees(empData);
      setAttendanceData(attData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendanceData.filter((record) => {
    if (selectedEmployee === 'all') return true;
    return record.employeeId === selectedEmployee;
  });

  const stats = {
    present: attendanceData.filter((r) => r.status === 'Present').length,
    absent: attendanceData.filter((r) => r.status === 'Absent').length,
    halfDay: attendanceData.filter((r) => r.status === 'Half-Day').length,
    leave: attendanceData.filter((r) => r.status === 'Leave').length,
  };

  const attendanceRate = attendanceData.length > 0
    ? ((stats.present / attendanceData.length) * 100).toFixed(1)
    : 0;

  const handleMarkAttendance = async (employeeId, status) => {
    try {
      const record = attendanceData.find(r => r.employeeId === employeeId && r.date === selectedDate);
      if (record) {
        await attendanceService.update(record.id, { status });
      } else {
        await attendanceService.add({
          employeeId,
          date: selectedDate,
          status,
          checkIn: status === 'Present' ? '09:00' : '-',
          checkOut: status === 'Present' ? '18:00' : '-',
        });
      }
      await fetchData();
    } catch (err) {
      console.error('Error marking attendance:', err);
      alert('Failed to update attendance');
    }
  };

  return (
    <div className="attendance-management">
      {error && <div className="error-message">{error}</div>}

      <div className="page-header">
        <div>
          <h1>Attendance Management</h1>
          <p className="page-subtitle">Track and manage employee attendance</p>
        </div>
        <div className="date-selector">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="view-mode-toggle">
        <button
          className={viewMode === 'daily' ? 'active' : ''}
          onClick={() => setViewMode('daily')}
        >
          Daily
        </button>
        <button
          className={viewMode === 'weekly' ? 'active' : ''}
          onClick={() => setViewMode('weekly')}
        >
          Weekly
        </button>
        <button
          className={viewMode === 'monthly' ? 'active' : ''}
          onClick={() => setViewMode('monthly')}
        >
          Monthly
        </button>
      </div>

      <div className="attendance-stats">
        <div className="stat-card present">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.present}</h3>
            <p>Present</p>
          </div>
          <div className="stat-percentage">{attendanceRate}%</div>
        </div>

        <div className="stat-card absent">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.absent}</h3>
            <p>Absent</p>
          </div>
          <div className="stat-percentage">
            {attendanceData.length > 0 ? ((stats.absent / attendanceData.length) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="stat-card half-day">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>{stats.halfDay}</h3>
            <p>Half Day</p>
          </div>
          <div className="stat-percentage">
            {attendanceData.length > 0 ? ((stats.halfDay / attendanceData.length) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="stat-card leave">
          <div className="stat-icon">✈️</div>
          <div className="stat-content">
            <h3>{stats.leave}</h3>
            <p>On Leave</p>
          </div>
          <div className="stat-percentage">
            {attendanceData.length > 0 ? ((stats.leave / attendanceData.length) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      <div className="filter-section">
        <select
          className="employee-filter"
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
        >
          <option value="all">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} - {emp.department}
            </option>
          ))}
        </select>
        <button className="export-btn">📊 Export Report</button>
      </div>

      <div className="attendance-table-container">
        {loading ? (
          <div className="loading-message">Loading attendance data...</div>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="employee-info">
                        <div className="employee-avatar">
                          {employees.find(e => e.id === record.employeeId)?.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('') || 'N/A'}
                        </div>
                        <div>
                          <div className="employee-name">
                            {employees.find(e => e.id === record.employeeId)?.name || 'Unknown'}
                          </div>
                          <div className="employee-id">{record.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="time-badge">{record.checkIn || '-'}</span>
                    </td>
                    <td>
                      <span className="time-badge">{record.checkOut || '-'}</span>
                    </td>
                    <td>
                      <span className="hours-badge">
                        {record.hours > 0 ? `${record.hours}h` : '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-dropdown">
                        <select
                          value={record.status}
                          onChange={(e) => handleMarkAttendance(record.employeeId, e.target.value)}
                          className="status-select"
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Half-Day">Half Day</option>
                          <option value="Leave">Leave</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-message">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {viewMode === 'weekly' && (
        <div className="calendar-view">
          <h2>Weekly Overview</h2>
          <div className="calendar-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <div key={day} className="calendar-day">
                <div className="day-header">
                  <span className="day-name">{day}</span>
                  <span className="day-date">{index + 1}</span>
                </div>
                <div className="day-stats">
                  <span className="present-count">✅ {Math.floor(Math.random() * 120)}</span>
                  <span className="absent-count">❌ {Math.floor(Math.random() * 10)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
