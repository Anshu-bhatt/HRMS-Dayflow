# 🔥 Firebase Integration Setup Guide

## Step 1: Install Firebase SDK

```bash
npm install firebase
```

## Step 2: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Click on "Project Settings" (gear icon)
4. Scroll to "Your apps" section
5. Click on Web app icon
6. Copy the Firebase config

## Step 3: Create .env File

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Then update the `.env` file with your Firebase credentials:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Step 4: Create Firestore Collections

In Firebase Console, create these collections in Firestore:

### 1. `employees` Collection
```javascript
{
  id: "auto",
  name: "John Doe",
  email: "john@example.com",
  phone: "+91 9876543210",
  department: "Engineering",
  position: "Senior Developer",
  joinDate: "2024-01-15",
  salary: 85000,
  status: "Active",
  avatar: "JD",
  createdAt: timestamp
}
```

### 2. `attendance` Collection
```javascript
{
  id: "auto",
  employeeId: "emp_id",
  employeeName: "John Doe",
  date: "2026-01-03",
  checkIn: "09:00",
  checkOut: "18:00",
  status: "Present",
  hours: 9,
  createdAt: timestamp
}
```

### 3. `leaves` Collection
```javascript
{
  id: "auto",
  employeeId: "emp_id",
  employeeName: "John Doe",
  department: "Engineering",
  leaveType: "Paid Leave",
  startDate: "2026-01-10",
  endDate: "2026-01-12",
  days: 3,
  reason: "Family vacation",
  status: "Pending",
  appliedOn: timestamp,
  approvedOn: null,
  rejectedOn: null,
  comments: ""
}
```

### 4. `payroll` Collection
```javascript
{
  id: "auto",
  employeeId: "emp_id",
  employeeName: "John Doe",
  baseSalary: 85000,
  allowances: 15000,
  deductions: 5000,
  netSalary: 95000,
  paymentStatus: "Paid",
  lastPaid: "2026-01-01",
  createdAt: timestamp
}
```

## Step 5: Set Firestore Security Rules

⚠️ **For Development Only** - Update rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **For Production**, use proper authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /employees/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /attendance/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /leaves/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /payroll/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 6: Restart Your App

```bash
npm start
```

## Available Firebase Services

All services are in `src/services/firebaseService.js`:

### Employee Service
- `employeeService.getAll()` - Get all employees
- `employeeService.add(data)` - Add employee
- `employeeService.update(id, data)` - Update employee
- `employeeService.delete(id)` - Delete employee
- `employeeService.getById(id)` - Get single employee

### Attendance Service
- `attendanceService.getAll()` - Get all records
- `attendanceService.getByEmployee(empId)` - Get employee's attendance
- `attendanceService.add(data)` - Add record
- `attendanceService.update(id, data)` - Update record

### Leave Service
- `leaveService.getAll()` - Get all requests
- `leaveService.getByEmployee(empId)` - Get employee's leaves
- `leaveService.getByStatus(status)` - Get by status
- `leaveService.apply(data)` - Apply for leave
- `leaveService.updateStatus(id, status, comments)` - Approve/Reject

### Payroll Service
- `payrollService.getAll()` - Get all records
- `payrollService.getByEmployee(empId)` - Get employee payroll
- `payrollService.add(data)` - Add record
- `payrollService.update(id, data)` - Update record
- `payrollService.markAsPaid(id)` - Mark as paid

### Dashboard Service
- `dashboardService.getStats()` - Get dashboard statistics

## Usage Example

```javascript
import { employeeService } from '../services/firebaseService';

// In your component
const [employees, setEmployees] = useState([]);

useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  fetchEmployees();
}, []);
```

## Troubleshooting

**Error: "Firebase is not initialized"**
- Make sure `.env` file is created with Firebase credentials
- Restart the dev server after creating `.env`

**Error: "Permission denied"**
- Check Firestore security rules
- Make sure you're authenticated (for production)

**Error: "Module not found"**
- Run `npm install firebase`
- Restart the dev server

---

**You're all set!** Your admin panel is now connected to Firebase! 🚀
