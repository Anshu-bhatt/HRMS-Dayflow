import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============ EMPLOYEES ============
export const employeeService = {
  // Get all employees
  getAll: async () => {
    try {
      const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Add new employee
  add: async (employeeData) => {
    try {
      const docRef = await addDoc(collection(db, 'employees'), {
        ...employeeData,
        createdAt: serverTimestamp(),
        joinDate: employeeData.joinDate || serverTimestamp(),
        name: employeeData.name || employeeData.fullName || '',
      });
      return { id: docRef.id, ...employeeData };
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  },

  // Update employee
  update: async (id, employeeData) => {
    try {
      const docRef = doc(db, 'employees', id);
      await updateDoc(docRef, {
        ...employeeData,
        updatedAt: serverTimestamp(),
      });
      return { id, ...employeeData };
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  // Delete employee
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, 'employees', id));
      return id;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },

  // Get single employee
  getById: async (id) => {
    try {
      const docRef = doc(db, 'employees', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting employee:', error);
      throw error;
    }
  },
};

// ============ USERS (for employee sync) ============
export const userService = {
  // Get users with userType === 'employee'
  getEmployees: async () => {
    try {
      // Fetch all users and filter client-side to avoid missing employees due to casing/field issues
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs
        .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
        .filter((docItem) => {
          const type = (docItem.userType || '').trim().toLowerCase();
          // Treat records with employee-type or with a department (legacy) as employees
          return type === 'employee' || (!!docItem.department && type !== 'admin');
        });
    } catch (error) {
      console.error('Error fetching users (employees):', error);
      throw error;
    }
  },
};

// ============ ATTENDANCE ============
export const attendanceService = {
  // Get attendance records
  getAll: async () => {
    try {
      const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },

  // Get attendance for specific employee
  getByEmployee: async (employeeId) => {
    try {
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', employeeId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },

  // Add attendance record
  add: async (attendanceData) => {
    try {
      const docRef = await addDoc(collection(db, 'attendance'), {
        ...attendanceData,
        createdAt: new Date(),
      });
      return { id: docRef.id, ...attendanceData };
    } catch (error) {
      console.error('Error adding attendance:', error);
      throw error;
    }
  },

  // Update attendance
  update: async (id, attendanceData) => {
    try {
      const docRef = doc(db, 'attendance', id);
      await updateDoc(docRef, attendanceData);
      return { id, ...attendanceData };
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  },
};

// ============ LEAVE REQUESTS ============
export const leaveService = {
  // Get all leave requests
  getAll: async () => {
    try {
      const q = query(collection(db, 'leaves'), orderBy('appliedOn', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching leaves:', error);
      throw error;
    }
  },

  // Get leave requests for specific employee
  getByEmployee: async (employeeId) => {
    try {
      const q = query(
        collection(db, 'leaves'),
        where('employeeId', '==', employeeId),
        orderBy('appliedOn', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching leaves:', error);
      throw error;
    }
  },

  // Get leaves by status
  getByStatus: async (status) => {
    try {
      const q = query(
        collection(db, 'leaves'),
        where('status', '==', status),
        orderBy('appliedOn', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching leaves:', error);
      throw error;
    }
  },

  // Apply for leave
  apply: async (leaveData) => {
    try {
      const docRef = await addDoc(collection(db, 'leaves'), {
        ...leaveData,
        status: 'Pending',
        appliedOn: new Date(),
      });
      return { id: docRef.id, ...leaveData };
    } catch (error) {
      console.error('Error applying for leave:', error);
      throw error;
    }
  },

  // Approve/Reject leave
  updateStatus: async (id, status, comments = '') => {
    try {
      const docRef = doc(db, 'leaves', id);
      const updateData = {
        status,
        [status === 'Approved' ? 'approvedOn' : 'rejectedOn']: new Date(),
      };
      if (comments) {
        updateData.comments = comments;
      }
      await updateDoc(docRef, updateData);
      return { id, ...updateData };
    } catch (error) {
      console.error('Error updating leave status:', error);
      throw error;
    }
  },
};

// ============ PAYROLL ============
export const payrollService = {
  // Get all payroll records
  getAll: async () => {
    try {
      const q = query(collection(db, 'payroll'), orderBy('employeeId'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching payroll:', error);
      throw error;
    }
  },

  // Get payroll for specific employee
  getByEmployee: async (employeeId) => {
    try {
      const q = query(
        collection(db, 'payroll'),
        where('employeeId', '==', employeeId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching payroll:', error);
      throw error;
    }
  },

  // Add payroll record
  add: async (payrollData) => {
    try {
      const docRef = await addDoc(collection(db, 'payroll'), {
        ...payrollData,
        createdAt: new Date(),
      });
      return { id: docRef.id, ...payrollData };
    } catch (error) {
      console.error('Error adding payroll:', error);
      throw error;
    }
  },

  // Update payroll
  update: async (id, payrollData) => {
    try {
      const docRef = doc(db, 'payroll', id);
      await updateDoc(docRef, {
        ...payrollData,
        updatedAt: new Date(),
      });
      return { id, ...payrollData };
    } catch (error) {
      console.error('Error updating payroll:', error);
      throw error;
    }
  },

  // Mark as paid
  markAsPaid: async (id) => {
    try {
      const docRef = doc(db, 'payroll', id);
      await updateDoc(docRef, {
        paymentStatus: 'Paid',
        lastPaid: new Date(),
      });
      return id;
    } catch (error) {
      console.error('Error marking as paid:', error);
      throw error;
    }
  },
};

// ============ DASHBOARD STATS ============
export const dashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      const employees = await employeeService.getAll();
      const leaves = await leaveService.getAll();
      const payrolls = await payrollService.getAll();

      return {
        totalEmployees: employees.length,
        pendingLeaves: leaves.filter(l => l.status === 'Pending').length,
        presentToday: Math.floor(Math.random() * (employees.length - 80)) + 80, // Demo calculation
        monthlyPayroll: payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0),
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },
};
