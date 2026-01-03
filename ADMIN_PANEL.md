# Dayflow Admin Panel

## 🚀 Features

The Dayflow Admin Panel is a comprehensive HRMS (Human Resource Management System) designed for hackathons and real-world applications. It includes:

### 1. **Dashboard** (`/admin/dashboard`)
- Quick overview with key metrics
- Total employees count
- Daily attendance rate
- Pending leave requests
- Monthly payroll summary
- Recent activities feed
- Upcoming leaves calendar
- Quick action buttons

### 2. **Employee Management** (`/admin/employees`)
- View all employees in a detailed table
- Search and filter by department
- Add new employees with complete information
- Edit existing employee details
- Delete employees
- View employee profiles
- Track employee statistics

### 3. **Attendance Management** (`/admin/attendance`)
- Daily, weekly, and monthly views
- Mark attendance (Present, Absent, Half-Day, Leave)
- View check-in/check-out times
- Calculate working hours
- Filter by employee
- Export attendance reports
- Calendar visualization
- Real-time attendance statistics

### 4. **Leave Approval** (`/admin/leave-approval`)
- View all leave requests
- Filter by status (Pending, Approved, Rejected)
- Detailed leave request information
- Approve or reject leaves
- Add comments/reasons for rejection
- Track leave history
- Multiple leave types support (Paid, Sick, Unpaid)

### 5. **Payroll Management** (`/admin/payroll`)
- Comprehensive salary management
- View and edit salary structures
- Base salary, allowances, and deductions
- Net salary calculation
- Payment status tracking
- Mark salaries as paid
- Salary breakdown overview
- Generate payroll reports
- Search and filter employees

## 🎨 Design Features

- **Modern UI/UX**: Clean, professional design with gradient accents
- **Responsive**: Fully responsive design for all screen sizes
- **Color Scheme**: Purple gradient theme (#667eea to #764ba2)
- **Smooth Animations**: Fade-in effects and smooth transitions
- **Card-based Layout**: Clean card components for better organization
- **Sidebar Navigation**: Collapsible sidebar with icons
- **Status Badges**: Color-coded status indicators
- **Modal Dialogs**: Beautiful modals for forms and details

## 🛠️ Tech Stack

- React 19.2.3
- React Router DOM 7.11.0
- Pure CSS (No external UI libraries)
- Modern JavaScript (ES6+)

## 📁 Project Structure

```
src/
├── components/
│   ├── HomePage.js
│   ├── LoginPage.js
│   └── admin/
│       ├── AdminLayout.js          # Main layout with sidebar
│       ├── AdminLayout.css
│       ├── AdminDashboard.js       # Dashboard overview
│       ├── AdminDashboard.css
│       ├── EmployeeManagement.js   # Employee CRUD
│       ├── EmployeeManagement.css
│       ├── AttendanceManagement.js # Attendance tracking
│       ├── AttendanceManagement.css
│       ├── LeaveApproval.js        # Leave management
│       ├── LeaveApproval.css
│       ├── PayrollManagement.js    # Salary management
│       └── PayrollManagement.css
├── App.js                          # Main routing
├── App.css                         # Global styles
└── index.js
```

## 🚦 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Access Admin Panel**
   - Navigate to: `http://localhost:3000/admin/dashboard`
   - Or use any admin route:
     - `/admin/dashboard` - Overview
     - `/admin/employees` - Employee Management
     - `/admin/attendance` - Attendance Tracking
     - `/admin/leave-approval` - Leave Requests
     - `/admin/payroll` - Payroll Management

## 🎯 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Landing page |
| `/login/:role` | LoginPage | Login page |
| `/admin/dashboard` | AdminDashboard | Admin overview |
| `/admin/employees` | EmployeeManagement | Employee CRUD |
| `/admin/attendance` | AttendanceManagement | Attendance tracking |
| `/admin/leave-approval` | LeaveApproval | Leave management |
| `/admin/payroll` | PayrollManagement | Payroll management |

## 💡 Key Features for Hackathon Demo

1. **Visual Appeal**: Modern gradient design that stands out
2. **Full Functionality**: All CRUD operations work seamlessly
3. **Real-time Updates**: Instant UI updates on data changes
4. **Interactive**: Modals, filters, search, and sorting
5. **Professional**: Production-ready code quality
6. **Scalable**: Easy to extend with new features

## 🎨 Unique Design Elements

- **Gradient Sidebar**: Purple gradient sidebar with smooth animations
- **Glass-morphism Cards**: Modern card designs with shadows
- **Color-coded Status**: Visual status indicators (green, orange, red)
- **Smooth Transitions**: All interactions have smooth animations
- **Responsive Tables**: Professional data tables with hover effects
- **Modal Overlays**: Beautiful modal dialogs for forms
- **Icon Integration**: Emoji icons for visual appeal

## 🔮 Future Enhancements

As mentioned in your problem statement:
- Email & notification alerts
- Analytics & reports dashboard
- Salary slips generation
- Advanced attendance reports
- Performance tracking
- Document management
- Multi-language support

## 📝 Notes

- All data is currently stored in component state (demo purposes)
- For production, integrate with backend API
- Add authentication middleware for route protection
- Implement role-based access control
- Add data persistence (database)

## 🏆 Perfect for Hackathons

This admin panel is designed to impress judges with:
- ✅ Complete feature set
- ✅ Professional UI/UX
- ✅ Clean, maintainable code
- ✅ Responsive design
- ✅ Smooth user experience
- ✅ Real-world applicability

---

**Built for Dayflow HRMS Hackathon Project** ⚡
