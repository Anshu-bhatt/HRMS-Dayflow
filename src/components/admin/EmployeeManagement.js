import React, { useEffect, useState } from 'react';
import { employeeService, userService } from '../../services/firebaseService';
import './EmployeeManagement.css';

const EmployeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    joinDate: '',
  });

  const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations'];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const [employeesData, usersEmployees] = await Promise.all([
        employeeService.getAll(),
        userService.getEmployees().catch(() => []),
      ]);

      const mergedMap = new Map();
      const addToMap = (emp) => {
        const key = emp.userId || emp.email || emp.id;
        if (!key) return;

        const existing = mergedMap.get(key) || {};
        mergedMap.set(key, {
          ...existing,
          ...emp,
          name: emp.name || emp.fullName || existing.name || 'Employee',
          email: emp.email || existing.email || '',
          department: emp.department || existing.department || '',
          position: emp.position || existing.position || '',
          phone: emp.phone || existing.phone || '',
          status: emp.status || existing.status || 'Active',
          joinDate: emp.joinDate || existing.joinDate || null,
          id: emp.id || existing.id || key,
          userId: emp.userId || existing.userId || key,
        });
      };

      employeesData.forEach(addToMap);
      usersEmployees.forEach(addToMap);

      setEmployees(Array.from(mergedMap.values()));
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const displayName = (emp.name || emp.fullName || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const id = (emp.id || '').toLowerCase();
    const searchValue = searchTerm.toLowerCase();

    const matchesSearch =
      displayName.includes(searchValue) || id.includes(searchValue) || email.includes(searchValue);
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleAddEmployee = async () => {
    if (!formData.name || !formData.email || !formData.department) {
      alert('Please fill in required fields');
      return;
    }

    try {
      if (selectedEmployee) {
        await employeeService.update(selectedEmployee.id, {
          ...formData,
          salary: parseInt(formData.salary, 10) || 0,
        });
      } else {
        await employeeService.add({
          ...formData,
          salary: parseInt(formData.salary, 10) || 0,
          status: 'Active',
          joinDate: formData.joinDate || new Date().toISOString(),
        });
      }
      closeModal();
      await fetchEmployees();
    } catch (err) {
      console.error('Error saving employee:', err);
      alert('Failed to save employee');
    }
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name || employee.fullName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      salary: employee.salary || '',
      joinDate: employee.joinDate || '',
    });
    setShowAddModal(true);
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.delete(id);
        await fetchEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
        alert('Failed to delete employee');
      }
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setSelectedEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      salary: '',
      joinDate: '',
    });
  };

  return (
    <div className="employee-management">
      {error && <div className="error-message">{error}</div>}

      <div className="page-header">
        <div>
          <h1>Employee Management</h1>
          <p className="page-subtitle">Manage your team and employee information</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchEmployees}>
            ⟳ Refresh
          </button>
          <button className="add-btn" onClick={() => setShowAddModal(true)}>
            <span className="add-icon">+</span>
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="department-filter"
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div className="employee-stats">
        <div className="stat-item">
          <span className="stat-label">Total Employees</span>
          <span className="stat-value">{employees.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value">{employees.filter((e) => (e.status || 'Active') === 'Active').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Departments</span>
          <span className="stat-value">{departments.length}</span>
        </div>
      </div>

      <div className="employee-table-container">
        {loading ? (
          <div className="loading-message">Loading employees...</div>
        ) : (
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th>Department</th>
                <th>Position</th>
                <th>Contact</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => {
                  const displayName = employee.name || employee.fullName || 'Employee';
                  const initials = displayName
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const joinDateValue = employee.joinDate;
                  const joinDate = joinDateValue && joinDateValue.seconds
                    ? new Date(joinDateValue.seconds * 1000)
                    : joinDateValue
                    ? new Date(joinDateValue)
                    : null;

                  return (
                    <tr key={employee.id}>
                      <td>
                        <div className="employee-info">
                          <div className="employee-avatar">{initials || 'E'}</div>
                          <div>
                            <div className="employee-name">{displayName}</div>
                            <div className="employee-email">{employee.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="employee-id">{employee.id}</span>
                      </td>
                      <td>
                        <span className="department-badge">{employee.department || '—'}</span>
                      </td>
                      <td>{employee.position || '—'}</td>
                      <td>{employee.phone || '—'}</td>
                      <td>{joinDate ? joinDate.toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`status-badge ${(employee.status || 'active').toLowerCase()}`}>
                          {employee.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            title="Edit"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete"
                            title="Delete"
                            onClick={() => handleDeleteEmployee(employee.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No employees found. Try adding one or click Refresh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 890"
                  />
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Software Engineer"
                  />
                </div>

                <div className="form-group">
                  <label>Salary</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="50000"
                  />
                </div>

                <div className="form-group">
                  <label>Join Date</label>
                  <input
                    type="date"
                    value={formData.joinDate ? formData.joinDate.toString().slice(0, 10) : ''}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={closeModal}>
                Cancel
              </button>
              <button className="primary-btn" onClick={handleAddEmployee}>
                {selectedEmployee ? 'Update' : 'Add'} Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
