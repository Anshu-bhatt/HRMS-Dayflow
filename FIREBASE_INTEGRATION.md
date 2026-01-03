# Firebase Integration Guide

## Overview
Firebase Authentication and Firestore have been integrated into the Signup and Login pages for the Dayflow HRMS system.

## What's Implemented

### 1. Firebase Configuration (`src/config/firebase.js`)
- **Imports**: Firebase Auth, Firestore, and Storage modules
- **Exports**: `auth`, `db`, and `storage` instances
- **Uses**: Environment variables (VITE_FIREBASE_*)

```javascript
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 2. Signup Page (`src/components/SignupPage.js`)

#### Features:
- **User Type Selection**: Choose between Employee and Admin registration
- **Firebase Authentication**: 
  - Creates new user with `createUserWithEmailAndPassword()`
  - Updates profile with display name via `updateProfile()`
- **Firestore Data Storage**:
  - Saves user data to `users` collection
  - Saves employee-specific data to `employees` collection if user type is "employee"
- **Admin Code Verification**: Only users with correct code (`DAYFLOW2026`) can register as admin
- **Error Handling**: Specific Firebase error messages:
  - Email already in use
  - Weak password
  - Invalid email format
  - General errors

#### Form Validation:
- ✅ Full name required
- ✅ Valid email format
- ✅ Password minimum 6 characters
- ✅ Password confirmation match
- ✅ Department required for employees
- ✅ Admin code required for admins
- ✅ Terms and conditions acceptance

#### Data Saved to Firestore:
```javascript
{
  fullName: string,
  email: string,
  userType: 'employee' | 'admin',
  userId: Firebase UID,
  // For employees only:
  department: string,
  position: string,
  phone: string,
  status: 'Active',
  // For employees in employees collection:
  joinDate: server timestamp,
  createdAt: server timestamp
}
```

### 3. Login Page (`src/components/LoginPage.js`)

#### Features:
- **Firebase Authentication**:
  - Authenticates user with `signInWithEmailAndPassword()`
  - Verifies user exists in Firestore
  - Checks user type matches login role
- **Role Verification**:
  - Looks up user in `users` collection by `userId`
  - Compares stored `userType` with login role
  - Prevents unauthorized role access
- **Error Handling**: Specific Firebase error messages:
  - Invalid credentials
  - User disabled
  - Too many login attempts
  - User profile not found
  - Role mismatch

#### Login Flow:
1. User enters email and password
2. Firebase Authentication validates credentials
3. Firestore lookup verifies user exists
4. User type is checked against login role
5. If all checks pass, redirect to appropriate dashboard
6. If role mismatch, sign out user and show error

### 4. UI/UX Improvements
- **Loading States**: Buttons show "Signing In..." or "Creating Account..."
- **Disabled Fields**: Inputs disabled during API calls
- **Error Messages**: Beautiful error display with animations
- **Responsive Design**: Works on all device sizes

## Firestore Collection Structure

### `users` Collection
Stores all user accounts with their profile information.

```
users/
├── docId1
│   ├── fullName: "John Doe"
│   ├── email: "john@example.com"
│   ├── userType: "employee"
│   ├── userId: "Firebase UID"
│   ├── department: "Engineering"
│   ├── position: "Senior Developer"
│   ├── phone: "+91 9876543210"
│   ├── status: "Active"
│   └── createdAt: timestamp
│
└── docId2
    ├── fullName: "Admin User"
    ├── email: "admin@dayflow.com"
    ├── userType: "admin"
    ├── userId: "Firebase UID"
    └── createdAt: timestamp
```

### `employees` Collection
Stores employee-specific information (created during signup).

```
employees/
├── docId1
│   ├── fullName: "John Doe"
│   ├── email: "john@example.com"
│   ├── userType: "employee"
│   ├── userId: "Firebase UID"
│   ├── department: "Engineering"
│   ├── position: "Senior Developer"
│   ├── phone: "+91 9876543210"
│   ├── status: "Active"
│   ├── createdAt: timestamp
│   └── joinDate: timestamp
│
└── docId2
    └── ... (more employees)
```

## Testing the Integration

### Creating Admin Account:
1. Navigate to `/signup`
2. Select "Admin" user type
3. Fill in form with details
4. Enter admin code: `DAYFLOW2026`
5. Click "Create Admin Account"
6. Redirects to `/admin/dashboard`

### Creating Employee Account:
1. Navigate to `/signup`
2. Select "Employee" user type
3. Fill in form with details (department required)
4. Click "Create Employee Account"
5. Redirects to home page

### Login:
1. Navigate to `/login/admin` (for admin login)
2. Enter registered email and password
3. System verifies credentials and user type
4. Redirects to `/admin/dashboard` if admin
5. Shows error if role doesn't match

## Firebase Security Rules (Development)

**Current Rules** (Permissive - for development):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Recommended Production Rules**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write employee documents
    match /employees/{docId} {
      allow read, write: if request.auth != null;
    }
    
    // Other collections with appropriate rules
    match /attendance/{docId} {
      allow read, write: if request.auth != null;
    }
    
    match /leaves/{docId} {
      allow read, write: if request.auth != null;
    }
    
    match /payroll/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Environment Variables

Make sure your `.env.local` file includes:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Next Steps

1. **Update Firebase Security Rules**: Replace permissive rules with production rules
2. **Add Email Verification**: Send verification emails after signup
3. **Add Password Reset**: Implement "Forgot Password" functionality
4. **Add Profile Completion**: Allow users to complete their profile after signup
5. **Add 2FA**: Optional two-factor authentication
6. **Employee Dashboard**: Create employee-facing dashboard
7. **Audit Logging**: Log all authentication events

## Error Codes Reference

### Authentication Errors
- `auth/email-already-in-use` - Email is registered
- `auth/weak-password` - Password too weak
- `auth/invalid-email` - Invalid email format
- `auth/user-not-found` - User doesn't exist
- `auth/wrong-password` - Incorrect password
- `auth/user-disabled` - Account disabled
- `auth/too-many-requests` - Too many failed attempts

## Notes

- All timestamps use Firestore `serverTimestamp()` for consistency
- Users can only see their own dashboard based on userType
- Admin code is `DAYFLOW2026` - change in production
- Password minimum is 6 characters (can be increased)
- All forms have proper validation and error handling
