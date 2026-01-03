import os
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, auth, firestore

# Initialize FastAPI
app = FastAPI(
    title="HRMS Backend",
    description="Backend API for HRMS System",
    version="1.0.0"
)

# Add CORS middleware FIRST (before other middleware/routes)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize Firebase Admin SDK
db = None
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase_credentials.json")
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("[INIT] Firebase Admin SDK initialized successfully")
except Exception as e:
    print(f"[INIT] Firebase initialization warning: {e}")
    print("[INIT] Note: Backend will run but /employee/profile endpoint will fail until credentials are added")
    print("[INIT] Please place firebase_credentials.json in the backend directory")


# ==================== Pydantic Models ====================

class PersonalDetails(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None


class JobDetails(BaseModel):
    employee_id: str
    designation: str
    department: str
    date_of_joining: str


class SalaryStructure(BaseModel):
    basic_pay: float
    allowances: float
    deductions: float
    net_salary: float


class Documents(BaseModel):
    aadhaar: Optional[str] = None
    pan: Optional[str] = None
    offer_letter: Optional[str] = None


class EmployeeProfile(BaseModel):
    uid: str
    personal_details: PersonalDetails
    job_details: JobDetails
    salary_structure: SalaryStructure
    documents: Documents
    profile_picture_url: Optional[str] = None
    last_updated: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    """Request model for updating employee profile"""
    # Fields editable by all roles
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None
    
    # Fields editable by admin only
    full_name: Optional[str] = None
    email: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    date_of_joining: Optional[str] = None
    basic_pay: Optional[float] = None
    allowances: Optional[float] = None
    deductions: Optional[float] = None
    net_salary: Optional[float] = None
    aadhaar: Optional[str] = None
    pan: Optional[str] = None
    offer_letter: Optional[str] = None


# ==================== Attendance Models ====================

class AttendanceCheckInRequest(BaseModel):
    """Request model for check-in"""
    date: str  # Format: YYYY-MM-DD


class AttendanceCheckOutRequest(BaseModel):
    """Request model for check-out"""
    date: str  # Format: YYYY-MM-DD


class AttendanceRecord(BaseModel):
    """Response model for attendance record"""
    date: str
    check_in: Optional[str] = None  # Format: HH:mm
    check_out: Optional[str] = None  # Format: HH:mm
    status: str  # "Present", "Absent", "Half-day", "Leave"
    user_id: str
    created_at: str


class AttendanceSummary(BaseModel):
    """Summary of attendance for employee"""
    user_id: str
    full_name: Optional[str] = None
    records: list[AttendanceRecord]


# ==================== Leave Models ====================

class LeaveApplyRequest(BaseModel):
    """Request model for applying leave"""
    leave_type: str  # "Paid", "Sick", "Unpaid"
    start_date: str  # Format: YYYY-MM-DD
    end_date: str    # Format: YYYY-MM-DD
    remarks: Optional[str] = None


class LeaveActionRequest(BaseModel):
    """Request model for approving/rejecting leave"""
    admin_comment: Optional[str] = None


class LeaveRecord(BaseModel):
    """Response model for leave record"""
    leave_id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    leave_type: str
    start_date: str
    end_date: str
    remarks: Optional[str] = None
    status: str  # "Pending", "Approved", "Rejected"
    admin_comment: Optional[str] = None
    created_at: str


# ==================== Payroll Models ====================

class PayrollData(BaseModel):
    """Response model for payroll data"""
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    basic_pay: float = 0.0
    allowances: float = 0.0
    deductions: float = 0.0
    net_salary: float = 0.0
    pay_cycle: str = "Monthly"
    updated_at: Optional[str] = None


class PayrollUpdateRequest(BaseModel):
    """Request model for updating payroll (admin only)"""
    basic_pay: Optional[float] = None
    allowances: Optional[float] = None
    deductions: Optional[float] = None


# ==================== Helper Functions ====================

def verify_firebase_token(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify Firebase ID token from Authorization header.
    Returns the user UID if valid, raises HTTPException if invalid.
    """
    if not authorization:
        print("[VERIFY TOKEN] Missing authorization header")
        raise HTTPException(status_code=401, detail="Missing authorization header")

    # Extract token from "Bearer <token>"
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            print(f"[VERIFY TOKEN] Invalid format - parts: {len(parts)}")
            raise HTTPException(status_code=401, detail="Invalid authorization format")

        token = parts[1]
        print(f"[VERIFY TOKEN] Token length: {len(token)}, first 20 chars: {token[:20]}...")
        
        # Check if token is a valid JWT format (should have 3 parts separated by dots)
        token_parts = token.split('.')
        print(f"[VERIFY TOKEN] Token parts: {len(token_parts)} (expected 3)")
        if len(token_parts) != 3:
            print(f"[VERIFY TOKEN] Invalid JWT format - Token does not have 3 parts!")
            raise HTTPException(status_code=401, detail="Invalid token format")
        
        # Check if Firebase admin app is initialized
        if not firebase_admin._apps:
            print(f"[VERIFY TOKEN] ERROR: Firebase admin not initialized!")
            raise HTTPException(status_code=500, detail="Server error: Firebase not configured")
        
        print(f"[VERIFY TOKEN] Firebase admin is initialized")
        
        try:
            print(f"[VERIFY TOKEN] Attempting to verify token...")
            # Use check_revoked=False to skip revocation check which can cause issues
            decoded_token = auth.verify_id_token(token, check_revoked=False)
            print(f"[VERIFY TOKEN] Token verified successfully")
            print(f"[VERIFY TOKEN] Decoded token keys: {list(decoded_token.keys())}")
            
            uid = decoded_token.get("uid")

            if not uid:
                print(f"[VERIFY TOKEN] No UID in decoded token: {decoded_token.keys()}")
                raise HTTPException(status_code=401, detail="Invalid token: missing UID")

            print(f"[VERIFY TOKEN] Returning UID: {uid}")
            return uid
            
        except firebase_admin.auth.ExpiredIdTokenError as e:
            print(f"[VERIFY TOKEN] Token expired: {str(e)}")
            raise HTTPException(status_code=401, detail="Token expired")
        except firebase_admin.auth.InvalidIdTokenError as e:
            print(f"[VERIFY TOKEN] Invalid token error: {str(e)}")
            print(f"[VERIFY TOKEN] Error details - cause: {getattr(e, 'cause', 'N/A')}")
            # Log more details about the token for debugging
            try:
                import base64
                import json
                # Try to decode the JWT header to see what's inside
                header_b64 = token.split('.')[0]
                # Add padding if needed
                padding = 4 - len(header_b64) % 4
                if padding != 4:
                    header_b64 += '=' * padding
                header_json = base64.urlsafe_b64decode(header_b64)
                header = json.loads(header_json)
                print(f"[VERIFY TOKEN] JWT Header: {header}")
            except Exception as decode_err:
                print(f"[VERIFY TOKEN] Could not decode JWT header: {decode_err}")
            raise HTTPException(status_code=401, detail="Invalid token")
        except firebase_admin.auth.CertificateError as e:
            print(f"[VERIFY TOKEN] Certificate error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
        except Exception as e:
            print(f"[VERIFY TOKEN] Verification exception - Type: {type(e).__name__}, Message: {str(e)}")
            import traceback
            print(f"[VERIFY TOKEN] Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[VERIFY TOKEN] Unexpected outer error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")


# ==================== Routes ====================

@app.options("/{full_path:path}")
async def preflight_handler(full_path: str):
    """Handle CORS preflight requests"""
    return JSONResponse(content={}, status_code=200)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint - verify backend is running"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "HRMS Backend",
        "firebase": "connected" if db else "not configured"
    }


@app.get("/test/profile", tags=["Test"])
async def get_test_profile():
    """
    TEST ENDPOINT: Get mock employee profile without authentication.
    Use this to verify CORS is working without needing Firebase.
    Remove this endpoint before deploying to production.
    """
    return {
        "uid": "test-user-123",
        "personal_details": {
            "full_name": "Test Employee",
            "email": "test@company.com",
            "phone": "+91-98765-43210",
            "address": "123 Main St, City"
        },
        "job_details": {
            "employee_id": "EMP001",
            "designation": "Software Engineer",
            "department": "IT",
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
            "offer_letter": "offer_letter.pdf"
        },
        "profile_picture_url": None,
        "last_updated": "2024-01-01T00:00:00Z"
    }


@app.get("/employee/profile", response_model=EmployeeProfile, tags=["Employee"])
async def get_employee_profile(uid: str = Depends(verify_firebase_token)):
    """
    Get employee profile data.
    - Requires valid Firebase ID token in Authorization header
    - Employee can only access their own profile
    - Returns structured employee profile data
    """
    if not db:
        raise HTTPException(
            status_code=500, 
            detail="Firestore not configured. Please add firebase_credentials.json to backend directory"
        )
    
    try:
        # Fetch user profile from Firestore
        user_doc = db.collection("users").document(uid).get()

        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User profile not found")

        user_data = user_doc.to_dict()

        # Verify user is an employee
        if user_data.get("role") != "employee":
            raise HTTPException(status_code=403, detail="Only employees can access this endpoint")

        # Extract profile data with defaults
        # Handle both 'full_name' and 'displayName' fields for backward compatibility
        full_name = user_data.get("full_name") or user_data.get("displayName") or "Not Set"
        personal_details = PersonalDetails(
            full_name=full_name,
            email=user_data.get("email", ""),
            phone=user_data.get("phone"),
            address=user_data.get("address")
        )

        job_details = JobDetails(
            employee_id=user_data.get("employee_id", "N/A"),
            designation=user_data.get("designation", "Not Set"),
            department=user_data.get("department", "Not Set"),
            date_of_joining=user_data.get("date_of_joining", "Not Set")
        )

        salary_structure = SalaryStructure(
            basic_pay=float(user_data.get("basic_pay", 0)),
            allowances=float(user_data.get("allowances", 0)),
            deductions=float(user_data.get("deductions", 0)),
            net_salary=float(user_data.get("net_salary", 0))
        )

        documents = Documents(
            aadhaar=user_data.get("aadhaar"),
            pan=user_data.get("pan"),
            offer_letter=user_data.get("offer_letter")
        )

        profile = EmployeeProfile(
            uid=uid,
            personal_details=personal_details,
            job_details=job_details,
            salary_structure=salary_structure,
            documents=documents,
            profile_picture_url=user_data.get("profile_picture_url"),
            last_updated=user_data.get("updated_at")
        )

        return profile

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching profile: {str(e)}"
        )


@app.put("/employee/profile", response_model=EmployeeProfile, tags=["Employee"])
async def update_employee_profile(
    update_data: UpdateProfileRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Update employee profile data.
    - Requires valid Firebase ID token in Authorization header
    - Employees can edit: phone, address, profile_picture_url
    - Admins can edit: all fields
    - Returns updated employee profile data
    """
    if not db:
        raise HTTPException(
            status_code=500,
            detail="Firestore not configured. Please add firebase_credentials.json to backend directory"
        )
    
    try:
        # Get user's role
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        user_role = user_data.get("role", "employee")
        
        print(f"[UPDATE PROFILE] User UID: {uid}, Role: {user_role}")
        print(f"[UPDATE PROFILE] Update data received: {update_data}")
        
        # Prepare update data based on role
        update_payload = {
            "updated_at": datetime.now().isoformat(),
        }
        
        # Always allow these fields to be updated (for both employees and admins)
        if update_data.phone is not None:
            update_payload["phone"] = update_data.phone
        if update_data.address is not None:
            update_payload["address"] = update_data.address
        if update_data.profile_picture_url is not None:
            update_payload["profile_picture_url"] = update_data.profile_picture_url
        if update_data.full_name is not None:
            update_payload["full_name"] = update_data.full_name
        
        print(f"[UPDATE PROFILE] User role check: user_role={user_role}, is_admin={user_role == 'admin'}")
        
        # Only allow admin to update sensitive fields (job details, salary, documents)
        if user_role == "admin":
            print(f"[UPDATE PROFILE] Admin detected, processing admin-only fields...")
            if update_data.email is not None:
                update_payload["email"] = update_data.email
            if update_data.designation is not None:
                update_payload["designation"] = update_data.designation
            if update_data.department is not None:
                update_payload["department"] = update_data.department
            if update_data.employee_id is not None:
                update_payload["employee_id"] = update_data.employee_id
            if update_data.date_of_joining is not None:
                update_payload["date_of_joining"] = update_data.date_of_joining
            if update_data.basic_pay is not None:
                update_payload["basic_pay"] = update_data.basic_pay
            if update_data.allowances is not None:
                update_payload["allowances"] = update_data.allowances
            if update_data.deductions is not None:
                update_payload["deductions"] = update_data.deductions
            if update_data.net_salary is not None:
                update_payload["net_salary"] = update_data.net_salary
            if update_data.aadhaar is not None:
                update_payload["aadhaar"] = update_data.aadhaar
            if update_data.pan is not None:
                update_payload["pan"] = update_data.pan
            if update_data.offer_letter is not None:
                update_payload["offer_letter"] = update_data.offer_letter
        else:
            print(f"[UPDATE PROFILE] Employee role, checking for unauthorized field updates...")
            # For non-admin users, reject attempts to update admin-only fields
            if (update_data.email is not None or 
                update_data.designation is not None or update_data.department is not None or
                update_data.employee_id is not None or update_data.date_of_joining is not None or
                update_data.basic_pay is not None or update_data.allowances is not None or
                update_data.deductions is not None or update_data.net_salary is not None or
                update_data.aadhaar is not None or update_data.pan is not None or
                update_data.offer_letter is not None):
                print(f"[UPDATE PROFILE] Unauthorized field update attempt by non-admin")
                raise HTTPException(
                    status_code=403,
                    detail="Employees can only edit: name, phone, address, and profile picture"
                )
        
        # Update document
        db.collection("users").document(uid).update(update_payload)
        print(f"[UPDATE PROFILE] Updated payload: {update_payload}")
        
        # Fetch and return updated profile
        updated_doc = db.collection("users").document(uid).get()
        updated_data = updated_doc.to_dict()
        print(f"[UPDATE PROFILE] Updated data from Firestore: {updated_data}")
        
        # Build response
        # Handle both 'full_name' and 'displayName' fields for backward compatibility
        full_name = updated_data.get("full_name") or updated_data.get("displayName") or "Not Set"
        personal_details = PersonalDetails(
            full_name=full_name,
            email=updated_data.get("email", ""),
            phone=updated_data.get("phone"),
            address=updated_data.get("address")
        )
        
        job_details = JobDetails(
            employee_id=updated_data.get("employee_id", "N/A"),
            designation=updated_data.get("designation", "Not Set"),
            department=updated_data.get("department", "Not Set"),
            date_of_joining=updated_data.get("date_of_joining", "Not Set")
        )
        
        salary_structure = SalaryStructure(
            basic_pay=float(updated_data.get("basic_pay", 0)),
            allowances=float(updated_data.get("allowances", 0)),
            deductions=float(updated_data.get("deductions", 0)),
            net_salary=float(updated_data.get("net_salary", 0))
        )
        
        documents = Documents(
            aadhaar=updated_data.get("aadhaar"),
            pan=updated_data.get("pan"),
            offer_letter=updated_data.get("offer_letter")
        )
        
        profile = EmployeeProfile(
            uid=uid,
            personal_details=personal_details,
            job_details=job_details,
            salary_structure=salary_structure,
            documents=documents,
            profile_picture_url=updated_data.get("profile_picture_url"),
            last_updated=updated_data.get("updated_at")
        )
        
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating profile: {str(e)}"
        )


# ==================== Attendance Endpoints ====================

@app.post("/attendance/check-in", response_model=AttendanceRecord, tags=["Attendance"])
async def check_in(
    request_data: AttendanceCheckInRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Record check-in for today.
    - Only one check-in per day allowed
    - Requires valid Firebase ID token
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        from datetime import datetime as dt_module
        check_in_time = dt_module.now().strftime("%H:%M")
        
        # Check if attendance record already exists for this date
        query = db.collection("attendance").where("user_id", "==", uid).where("date", "==", request_data.date)
        existing = list(query.stream())
        
        if existing:
            existing_record = existing[0].to_dict()
            if existing_record.get("check_in"):
                raise HTTPException(
                    status_code=400,
                    detail="Already checked in for this date"
                )
            # Update existing record with check-in time
            doc_ref = query.stream()[0].reference
            doc_ref.update({
                "check_in": check_in_time,
                "updated_at": dt_module.now().isoformat()
            })
            updated_record = doc_ref.get().to_dict()
        else:
            # Create new attendance record
            attendance_data = {
                "user_id": uid,
                "date": request_data.date,
                "check_in": check_in_time,
                "check_out": None,
                "status": "Present",
                "created_at": dt_module.now().isoformat(),
                "updated_at": dt_module.now().isoformat()
            }
            db.collection("attendance").add(attendance_data)
            updated_record = attendance_data
        
        return AttendanceRecord(
            date=updated_record.get("date"),
            check_in=updated_record.get("check_in"),
            check_out=updated_record.get("check_out"),
            status=updated_record.get("status", "Present"),
            user_id=uid,
            created_at=updated_record.get("created_at", "")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CHECK-IN ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during check-in: {str(e)}")


@app.post("/attendance/check-out", response_model=AttendanceRecord, tags=["Attendance"])
async def check_out(
    request_data: AttendanceCheckOutRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Record check-out for today.
    - Can only check out after checking in
    - Only one check-out per day allowed
    - Requires valid Firebase ID token
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        from datetime import datetime as dt_module
        check_out_time = dt_module.now().strftime("%H:%M")
        
        # Find attendance record for this date
        query = db.collection("attendance").where("user_id", "==", uid).where("date", "==", request_data.date)
        existing = list(query.stream())
        
        if not existing:
            raise HTTPException(
                status_code=400,
                detail="No check-in record found for this date. Please check in first."
            )
        
        existing_record = existing[0].to_dict()
        
        if not existing_record.get("check_in"):
            raise HTTPException(
                status_code=400,
                detail="Must check in before checking out"
            )
        
        if existing_record.get("check_out"):
            raise HTTPException(
                status_code=400,
                detail="Already checked out for this date"
            )
        
        # Update with check-out time and calculate status
        doc_ref = existing[0].reference
        check_in = existing_record.get("check_in")
        
        # Simple status calculation: if worked < 4 hours, it's half-day, else full day
        check_in_time = dt_module.strptime(check_in, "%H:%M")
        check_out_dt = dt_module.strptime(check_out_time, "%H:%M")
        hours_worked = (check_out_dt - check_in_time).total_seconds() / 3600
        
        status = "Half-day" if hours_worked < 4 else "Present"
        
        doc_ref.update({
            "check_out": check_out_time,
            "status": status,
            "updated_at": dt_module.now().isoformat()
        })
        
        updated_record = doc_ref.get().to_dict()
        
        return AttendanceRecord(
            date=updated_record.get("date"),
            check_in=updated_record.get("check_in"),
            check_out=updated_record.get("check_out"),
            status=updated_record.get("status", "Present"),
            user_id=uid,
            created_at=updated_record.get("created_at", "")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CHECK-OUT ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during check-out: {str(e)}")


@app.get("/attendance/my", tags=["Attendance"])
async def get_my_attendance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    uid: str = Depends(verify_firebase_token)
):
    """
    Get employee's own attendance records.
    - Can filter by date range (optional)
    - Returns last 30 days if no range specified
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        from datetime import datetime as dt_module, timedelta
        
        # Default to last 30 days
        if not end_date:
            end_date = dt_module.now().strftime("%Y-%m-%d")
        if not start_date:
            start_date = (dt_module.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        # Query attendance records - only filter by user_id to avoid composite index requirement
        # Then filter by date range in Python
        query = db.collection("attendance").where("user_id", "==", uid)
        
        records = []
        for doc in query.stream():
            record_data = doc.to_dict()
            record_date = record_data.get("date", "")
            # Filter by date range in Python
            if record_date and start_date <= record_date <= end_date:
                records.append(AttendanceRecord(
                    date=record_date,
                    check_in=record_data.get("check_in"),
                    check_out=record_data.get("check_out"),
                    status=record_data.get("status", "Absent"),
                    user_id=uid,
                    created_at=record_data.get("created_at", "")
                ))
        
        # Sort by date
        records.sort(key=lambda r: r.date if r.date else "")
        
        return {
            "user_id": uid,
            "records": records,
            "start_date": start_date,
            "end_date": end_date
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET ATTENDANCE ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching attendance: {str(e)}")


@app.get("/attendance/all", tags=["Attendance"])
async def get_all_attendance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    uid: str = Depends(verify_firebase_token)
):
    """
    Get all employees' attendance records (Admin only).
    - Verify user is admin
    - Can filter by date range
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        # Verify user is admin
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        if user_data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can view all attendance")
        
        from datetime import datetime as dt_module, timedelta
        
        # Default to last 30 days
        if not end_date:
            end_date = dt_module.now().strftime("%Y-%m-%d")
        if not start_date:
            start_date = (dt_module.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        # Query all attendance records and filter by date in Python to avoid index requirement
        query = db.collection("attendance")
        
        # Group by user_id
        attendance_by_user = {}
        for doc in query.stream():
            record_data = doc.to_dict()
            record_date = record_data.get("date", "")
            
            # Filter by date range in Python
            if not record_date or record_date < start_date or record_date > end_date:
                continue
                
            user_id = record_data.get("user_id")
            
            if user_id not in attendance_by_user:
                # Get user's full name
                user_info = db.collection("users").document(user_id).get()
                user_info_data = user_info.to_dict() if user_info.exists else {}
                full_name = user_info_data.get("full_name") or user_info_data.get("displayName") or "Unknown"
                
                attendance_by_user[user_id] = {
                    "user_id": user_id,
                    "full_name": full_name,
                    "records": []
                }
            
            attendance_by_user[user_id]["records"].append({
                "date": record_data.get("date"),
                "check_in": record_data.get("check_in"),
                "check_out": record_data.get("check_out"),
                "status": record_data.get("status", "Absent")
            })
        
        return {
            "employees": list(attendance_by_user.values()),
            "start_date": start_date,
            "end_date": end_date,
            "total_employees": len(attendance_by_user)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET ALL ATTENDANCE ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching attendance: {str(e)}")


# ==================== Leave Endpoints ====================

@app.post("/leave/apply", tags=["Leave"])
async def apply_leave(
    request: LeaveApplyRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Apply for leave (Employee).
    - Validates leave type and date range
    - Checks for overlapping leave requests
    - Creates leave request with 'Pending' status
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        from datetime import datetime as dt_module
        
        # Validate leave type
        valid_leave_types = ["Paid", "Sick", "Unpaid"]
        if request.leave_type not in valid_leave_types:
            raise HTTPException(status_code=400, detail=f"Invalid leave type. Must be one of: {valid_leave_types}")
        
        # Validate date format and range
        try:
            start = dt_module.strptime(request.start_date, "%Y-%m-%d")
            end = dt_module.strptime(request.end_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        if end < start:
            raise HTTPException(status_code=400, detail="End date cannot be before start date")
        
        # Check for overlapping leave requests (only pending or approved)
        existing_leaves = db.collection("leaves").where("user_id", "==", uid).stream()
        
        for doc in existing_leaves:
            leave_data = doc.to_dict()
            if leave_data.get("status") == "Rejected":
                continue  # Skip rejected leaves
            
            existing_start = dt_module.strptime(leave_data.get("start_date"), "%Y-%m-%d")
            existing_end = dt_module.strptime(leave_data.get("end_date"), "%Y-%m-%d")
            
            # Check for overlap: (start1 <= end2) and (end1 >= start2)
            if start <= existing_end and end >= existing_start:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Leave dates overlap with existing {leave_data.get('status').lower()} leave from {leave_data.get('start_date')} to {leave_data.get('end_date')}"
                )
        
        # Create leave request
        leave_data = {
            "user_id": uid,
            "leave_type": request.leave_type,
            "start_date": request.start_date,
            "end_date": request.end_date,
            "remarks": request.remarks or "",
            "status": "Pending",
            "admin_comment": None,
            "created_at": dt_module.now().isoformat()
        }
        
        # Add to Firestore
        doc_ref = db.collection("leaves").add(leave_data)
        leave_id = doc_ref[1].id
        
        print(f"[LEAVE APPLY] User {uid} applied for {request.leave_type} leave from {request.start_date} to {request.end_date}")
        
        return {
            "message": "Leave application submitted successfully",
            "leave_id": leave_id,
            "status": "Pending",
            **leave_data
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[LEAVE APPLY ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error applying for leave: {str(e)}")


@app.get("/leave/my", tags=["Leave"])
async def get_my_leaves(
    uid: str = Depends(verify_firebase_token)
):
    """
    Get employee's own leave requests.
    Returns all leave requests for the authenticated user.
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        # Query leaves for this user
        leaves_query = db.collection("leaves").where("user_id", "==", uid)
        
        leaves = []
        for doc in leaves_query.stream():
            leave_data = doc.to_dict()
            leaves.append(LeaveRecord(
                leave_id=doc.id,
                user_id=uid,
                user_name=None,
                user_email=None,
                leave_type=leave_data.get("leave_type", ""),
                start_date=leave_data.get("start_date", ""),
                end_date=leave_data.get("end_date", ""),
                remarks=leave_data.get("remarks"),
                status=leave_data.get("status", "Pending"),
                admin_comment=leave_data.get("admin_comment"),
                created_at=leave_data.get("created_at", "")
            ))
        
        # Sort by created_at descending (newest first)
        leaves.sort(key=lambda x: x.created_at, reverse=True)
        
        return {
            "user_id": uid,
            "leaves": leaves,
            "total": len(leaves)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET MY LEAVES ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching leaves: {str(e)}")


@app.get("/leave/all", tags=["Leave"])
async def get_all_leaves(
    status: Optional[str] = None,
    uid: str = Depends(verify_firebase_token)
):
    """
    Get all leave requests (Admin only).
    - Optionally filter by status (Pending, Approved, Rejected)
    - Returns leave requests with user info
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        # Verify user is admin
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        if user_data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can view all leave requests")
        
        # Query all leaves
        leaves_query = db.collection("leaves")
        
        leaves = []
        user_cache = {}  # Cache user info to avoid repeated queries
        
        for doc in leaves_query.stream():
            leave_data = doc.to_dict()
            
            # Filter by status if specified
            if status and leave_data.get("status") != status:
                continue
            
            # Get user info (with caching)
            leave_user_id = leave_data.get("user_id")
            if leave_user_id not in user_cache:
                leave_user_doc = db.collection("users").document(leave_user_id).get()
                if leave_user_doc.exists:
                    leave_user_data = leave_user_doc.to_dict()
                    user_cache[leave_user_id] = {
                        "name": leave_user_data.get("full_name") or leave_user_data.get("displayName") or "Unknown",
                        "email": leave_user_data.get("email", "")
                    }
                else:
                    user_cache[leave_user_id] = {"name": "Unknown", "email": ""}
            
            leaves.append(LeaveRecord(
                leave_id=doc.id,
                user_id=leave_user_id,
                user_name=user_cache[leave_user_id]["name"],
                user_email=user_cache[leave_user_id]["email"],
                leave_type=leave_data.get("leave_type", ""),
                start_date=leave_data.get("start_date", ""),
                end_date=leave_data.get("end_date", ""),
                remarks=leave_data.get("remarks"),
                status=leave_data.get("status", "Pending"),
                admin_comment=leave_data.get("admin_comment"),
                created_at=leave_data.get("created_at", "")
            ))
        
        # Sort by created_at descending (newest first)
        leaves.sort(key=lambda x: x.created_at, reverse=True)
        
        return {
            "leaves": leaves,
            "total": len(leaves),
            "filter_status": status
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET ALL LEAVES ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching leaves: {str(e)}")


@app.put("/leave/{leave_id}/approve", tags=["Leave"])
async def approve_leave(
    leave_id: str,
    request: LeaveActionRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Approve a leave request (Admin only).
    - Updates leave status to 'Approved'
    - Adds admin comment if provided
    - Updates attendance records for leave dates as 'Leave'
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        from datetime import datetime as dt_module, timedelta
        
        # Verify user is admin
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        if user_data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can approve leave requests")
        
        # Get leave request
        leave_doc = db.collection("leaves").document(leave_id).get()
        if not leave_doc.exists:
            raise HTTPException(status_code=404, detail="Leave request not found")
        
        leave_data = leave_doc.to_dict()
        
        if leave_data.get("status") != "Pending":
            raise HTTPException(status_code=400, detail=f"Cannot approve leave that is already {leave_data.get('status')}")
        
        # Update leave status
        db.collection("leaves").document(leave_id).update({
            "status": "Approved",
            "admin_comment": request.admin_comment or "",
            "approved_by": uid,
            "approved_at": dt_module.now().isoformat()
        })
        
        # Update attendance records for leave dates
        start_date = dt_module.strptime(leave_data.get("start_date"), "%Y-%m-%d")
        end_date = dt_module.strptime(leave_data.get("end_date"), "%Y-%m-%d")
        leave_user_id = leave_data.get("user_id")
        
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")
            
            # Check if attendance record exists for this date
            att_query = db.collection("attendance").where("user_id", "==", leave_user_id).where("date", "==", date_str).limit(1)
            att_docs = list(att_query.stream())
            
            if att_docs:
                # Update existing record
                db.collection("attendance").document(att_docs[0].id).update({
                    "status": "Leave",
                    "leave_type": leave_data.get("leave_type")
                })
            else:
                # Create new attendance record with Leave status
                db.collection("attendance").add({
                    "user_id": leave_user_id,
                    "date": date_str,
                    "check_in": None,
                    "check_out": None,
                    "status": "Leave",
                    "leave_type": leave_data.get("leave_type"),
                    "created_at": dt_module.now().isoformat()
                })
            
            current_date += timedelta(days=1)
        
        print(f"[LEAVE APPROVE] Leave {leave_id} approved by admin {uid}")
        
        return {
            "message": "Leave approved successfully",
            "leave_id": leave_id,
            "status": "Approved"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[LEAVE APPROVE ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error approving leave: {str(e)}")


@app.put("/leave/{leave_id}/reject", tags=["Leave"])
async def reject_leave(
    leave_id: str,
    request: LeaveActionRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Reject a leave request (Admin only).
    - Updates leave status to 'Rejected'
    - Adds admin comment if provided
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        from datetime import datetime as dt_module
        
        # Verify user is admin
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        if user_data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can reject leave requests")
        
        # Get leave request
        leave_doc = db.collection("leaves").document(leave_id).get()
        if not leave_doc.exists:
            raise HTTPException(status_code=404, detail="Leave request not found")
        
        leave_data = leave_doc.to_dict()
        
        if leave_data.get("status") != "Pending":
            raise HTTPException(status_code=400, detail=f"Cannot reject leave that is already {leave_data.get('status')}")
        
        # Update leave status
        db.collection("leaves").document(leave_id).update({
            "status": "Rejected",
            "admin_comment": request.admin_comment or "",
            "rejected_by": uid,
            "rejected_at": dt_module.now().isoformat()
        })
        
        print(f"[LEAVE REJECT] Leave {leave_id} rejected by admin {uid}")
        
        return {
            "message": "Leave rejected",
            "leave_id": leave_id,
            "status": "Rejected"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[LEAVE REJECT ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error rejecting leave: {str(e)}")


# ==================== Payroll Endpoints ====================

@app.get("/payroll/my", tags=["Payroll"])
async def get_my_payroll(
    uid: str = Depends(verify_firebase_token)
):
    """
    Get employee's own payroll details (read-only).
    Returns salary structure for the authenticated employee.
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        # Get user document
        user_doc = db.collection("users").document(uid).get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        
        # Extract payroll data from salary_structure or payroll field
        basic_pay = user_data.get("basic_pay", 0) or user_data.get("salary_structure", {}).get("basic_pay", 0)
        allowances = user_data.get("allowances", 0) or user_data.get("salary_structure", {}).get("allowances", 0)
        deductions = user_data.get("deductions", 0) or user_data.get("salary_structure", {}).get("deductions", 0)
        net_salary = user_data.get("net_salary", 0) or user_data.get("salary_structure", {}).get("net_salary", 0)
        
        # Auto-calculate net salary if not set
        if net_salary == 0 and (basic_pay > 0 or allowances > 0):
            net_salary = basic_pay + allowances - deductions
        
        return PayrollData(
            user_id=uid,
            user_name=user_data.get("full_name") or user_data.get("displayName"),
            user_email=user_data.get("email"),
            basic_pay=float(basic_pay),
            allowances=float(allowances),
            deductions=float(deductions),
            net_salary=float(net_salary),
            pay_cycle="Monthly",
            updated_at=user_data.get("payroll_updated_at") or user_data.get("last_updated")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET MY PAYROLL ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching payroll: {str(e)}")


@app.get("/payroll/all", tags=["Payroll"])
async def get_all_payroll(
    uid: str = Depends(verify_firebase_token)
):
    """
    Get payroll details of all employees (Admin only).
    Returns list of employees with their salary structures.
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        # Verify user is admin
        admin_doc = db.collection("users").document(uid).get()
        if not admin_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        admin_data = admin_doc.to_dict()
        if admin_data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can view all payroll data")
        
        # Get all employees
        users_query = db.collection("users").where("role", "==", "employee")
        
        payroll_list = []
        for doc in users_query.stream():
            user_data = doc.to_dict()
            user_id = doc.id
            
            # Extract payroll data
            basic_pay = user_data.get("basic_pay", 0) or user_data.get("salary_structure", {}).get("basic_pay", 0)
            allowances = user_data.get("allowances", 0) or user_data.get("salary_structure", {}).get("allowances", 0)
            deductions = user_data.get("deductions", 0) or user_data.get("salary_structure", {}).get("deductions", 0)
            net_salary = user_data.get("net_salary", 0) or user_data.get("salary_structure", {}).get("net_salary", 0)
            
            # Auto-calculate net salary if not set
            if net_salary == 0 and (basic_pay > 0 or allowances > 0):
                net_salary = basic_pay + allowances - deductions
            
            payroll_list.append(PayrollData(
                user_id=user_id,
                user_name=user_data.get("full_name") or user_data.get("displayName") or "Not Set",
                user_email=user_data.get("email"),
                basic_pay=float(basic_pay),
                allowances=float(allowances),
                deductions=float(deductions),
                net_salary=float(net_salary),
                pay_cycle="Monthly",
                updated_at=user_data.get("payroll_updated_at") or user_data.get("last_updated")
            ))
        
        # Sort by name
        payroll_list.sort(key=lambda x: x.user_name or "")
        
        return {
            "employees": payroll_list,
            "total": len(payroll_list)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GET ALL PAYROLL ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching payroll: {str(e)}")


@app.put("/payroll/{user_id}/update", tags=["Payroll"])
async def update_payroll(
    user_id: str,
    request: PayrollUpdateRequest,
    uid: str = Depends(verify_firebase_token)
):
    """
    Update employee payroll/salary structure (Admin only).
    - Auto-calculates net salary
    - Updates immediately in employee's record
    """
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not configured")
    
    try:
        from datetime import datetime as dt_module
        
        # Verify user is admin
        admin_doc = db.collection("users").document(uid).get()
        if not admin_doc.exists:
            raise HTTPException(status_code=404, detail="Admin user not found")
        
        admin_data = admin_doc.to_dict()
        if admin_data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can update payroll")
        
        # Check if target employee exists
        employee_doc = db.collection("users").document(user_id).get()
        if not employee_doc.exists:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        employee_data = employee_doc.to_dict()
        
        # Get current values or defaults
        current_basic = employee_data.get("basic_pay", 0) or employee_data.get("salary_structure", {}).get("basic_pay", 0)
        current_allowances = employee_data.get("allowances", 0) or employee_data.get("salary_structure", {}).get("allowances", 0)
        current_deductions = employee_data.get("deductions", 0) or employee_data.get("salary_structure", {}).get("deductions", 0)
        
        # Apply updates
        new_basic = request.basic_pay if request.basic_pay is not None else current_basic
        new_allowances = request.allowances if request.allowances is not None else current_allowances
        new_deductions = request.deductions if request.deductions is not None else current_deductions
        
        # Auto-calculate net salary
        new_net_salary = new_basic + new_allowances - new_deductions
        
        # Update employee document
        update_data = {
            "basic_pay": float(new_basic),
            "allowances": float(new_allowances),
            "deductions": float(new_deductions),
            "net_salary": float(new_net_salary),
            "payroll_updated_at": dt_module.now().isoformat(),
            "payroll_updated_by": uid
        }
        
        db.collection("users").document(user_id).update(update_data)
        
        print(f"[PAYROLL UPDATE] Admin {uid} updated payroll for employee {user_id}")
        
        return {
            "message": "Payroll updated successfully",
            "user_id": user_id,
            "basic_pay": float(new_basic),
            "allowances": float(new_allowances),
            "deductions": float(new_deductions),
            "net_salary": float(new_net_salary),
            "updated_at": update_data["payroll_updated_at"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PAYROLL UPDATE ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating payroll: {str(e)}")


# ==================== Error Handlers ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Exception",
            "status_code": exc.status_code,
            "detail": exc.detail
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
