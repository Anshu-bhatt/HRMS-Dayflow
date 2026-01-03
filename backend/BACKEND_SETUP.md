# Backend Setup Guide

## 🚀 Getting Started

### 1. Get Firebase Credentials

1. Go to https://console.firebase.google.com/
2. Select your project: **dayflow-d735d**
3. Click **Project Settings** (gear icon, top-left)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file

### 2. Add Credentials to Backend

1. Place the downloaded JSON file as: `backend/firebase_credentials.json`
2. Never commit this file to git (add to .gitignore)

### 3. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Start the Backend Server

```bash
python main.py
```

Backend runs on: http://localhost:8000

### 5. Test the API

Go to: http://localhost:8000/docs (Swagger UI)

---

## 🔌 API Endpoints

### Health Check

```
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-01-03T12:00:00",
  "service": "HRMS Backend"
}
```

### Get Employee Profile

```
GET /employee/profile
Header: Authorization: Bearer {firebase_id_token}
```

Response (200):

```json
{
  "uid": "user123",
  "personal_details": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St"
  },
  "job_details": {
    "employee_id": "EMP001",
    "designation": "Software Engineer",
    "department": "Engineering",
    "date_of_joining": "2023-01-15"
  },
  "salary_structure": {
    "basic_pay": 50000,
    "allowances": 10000,
    "deductions": 5000,
    "net_salary": 55000
  },
  "documents": {
    "aadhaar": "XXXX-XXXX-1234",
    "pan": "ABCDE1234F",
    "offer_letter": "https://example.com/offer.pdf"
  },
  "profile_picture_url": "https://example.com/profile.jpg",
  "last_updated": "2026-01-03"
}
```

---

## 🔐 Security

- ✅ Firebase token verification on all protected endpoints
- ✅ Employee can only access their own profile
- ✅ Role-based access control (employees only)
- ✅ CORS configured for frontend

---

## 📝 Firestore Data Structure

Your user document in Firestore should have:

```
users/
  {uid}/
    - role: "employee"
    - email: "john@example.com"
    - full_name: "John Doe"
    - phone: "+1234567890"
    - address: "123 Main St"
    - employee_id: "EMP001"
    - designation: "Software Engineer"
    - department: "Engineering"
    - date_of_joining: "2023-01-15"
    - basic_pay: 50000
    - allowances: 10000
    - deductions: 5000
    - net_salary: 55000
    - aadhaar: "XXXX-XXXX-1234"
    - pan: "ABCDE1234F"
    - offer_letter: "url or filename"
    - profile_picture_url: "url"
    - updated_at: "2026-01-03"
```

---

## 🐛 Troubleshooting

### Error: "firebase_credentials.json not found"

- Download credentials from Firebase Console
- Place file in `backend/` directory
- Never add to git (add to .gitignore)

### Error: "ModuleNotFoundError: No module named 'firebase_admin'"

```bash
pip install -r requirements.txt
```

### Error: "CORS blocked"

- Backend CORS is already configured for localhost:3000 and localhost:3001
- For production, update CORS origins in main.py

### API not responding

- Check backend is running: http://localhost:8000/health
- Check frontend is sending correct Authorization header
- Check token is valid (not expired)

---

## 📚 API Documentation

Automatic Swagger UI docs available at:

- http://localhost:8000/docs (Swagger)
- http://localhost:8000/redoc (ReDoc)

---

## 🚀 Production Checklist

- [ ] Store credentials securely (environment variables, not in repo)
- [ ] Add database indexing for performance
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Add error monitoring (Sentry)
- [ ] Use HTTPS
- [ ] Add API versioning (/v1/employee/profile)
- [ ] Add input validation/sanitization
- [ ] Test all security scenarios
