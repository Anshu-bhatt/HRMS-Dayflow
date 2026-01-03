#!/usr/bin/env python3
"""
Script to populate test employee data in Firestore.

Usage:
    1. Ensure you have firebase_credentials.json in backend/
    2. Run: python populate_test_data.py
    3. Provide the UID of an employee user when prompted
"""

import firebase_admin
from firebase_admin import credentials, firestore
import sys
from datetime import datetime

# Initialize Firebase
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase_credentials.json")
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase initialized successfully\n")
except Exception as e:
    print(f"❌ Firebase initialization failed: {e}")
    print("Make sure firebase_credentials.json exists in the current directory")
    sys.exit(1)


def populate_employee_data(uid):
    """Populate test employee data for the given UID"""
    
    sample_data = {
        "role": "employee",
        "email": f"employee_{uid[:8]}@example.com",
        "full_name": "John Doe",
        "phone": "+1 (555) 123-4567",
        "address": "123 Main Street, San Francisco, CA 94105",
        "employee_id": "EMP2024001",
        "designation": "Senior Software Engineer",
        "department": "Engineering",
        "date_of_joining": "2023-01-15",
        "basic_pay": 75000.00,
        "allowances": 15000.00,
        "deductions": 10000.00,
        "net_salary": 80000.00,
        "aadhaar": "1234-5678-9012",
        "pan": "ABCDE1234F",
        "offer_letter": "https://example.com/offer_letter.pdf",
        "profile_picture_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=" + uid[:8],
        "updated_at": datetime.now().isoformat(),
        "createdAt": datetime.now(),
    }
    
    try:
        # Update the user document with employee data
        db.collection("users").document(uid).update(sample_data)
        print(f"✅ Successfully updated employee data for UID: {uid}\n")
        print("📋 Updated fields:")
        for key, value in sample_data.items():
            print(f"  - {key}: {value}")
        return True
    except Exception as e:
        print(f"❌ Error updating employee data: {e}")
        return False


def verify_data(uid):
    """Verify the data was saved correctly"""
    try:
        doc = db.collection("users").document(uid).get()
        if doc.exists:
            data = doc.to_dict()
            print("\n✅ Data verification successful!")
            print("\n📊 Current user document:")
            for key, value in sorted(data.items()):
                if isinstance(value, dict):
                    print(f"  {key}: {value}")
                else:
                    print(f"  {key}: {value}")
            return True
        else:
            print(f"\n❌ User document not found for UID: {uid}")
            return False
    except Exception as e:
        print(f"\n❌ Verification failed: {e}")
        return False


def main():
    print("=" * 60)
    print("  HRMS - Employee Profile Test Data Populator")
    print("=" * 60)
    print()
    
    # Get UID from user
    uid = input("Enter the Firebase UID of an employee user: ").strip()
    
    if not uid:
        print("❌ UID cannot be empty")
        sys.exit(1)
    
    print(f"\n🔄 Updating employee data for UID: {uid}")
    print("-" * 60)
    
    # Populate data
    if populate_employee_data(uid):
        # Verify data
        input("\nPress Enter to verify the data was saved...")
        verify_data(uid)
        
        print("\n" + "=" * 60)
        print("✅ Setup complete!")
        print("=" * 60)
        print("\n📝 Next steps:")
        print("  1. Start the backend: python main.py")
        print("  2. Start the frontend: npm start (in HRMS-Dayflow folder)")
        print("  3. Login with this employee account")
        print("  4. Go to Employee Dashboard → My Profile")
        print("  5. You should see the profile data displayed!")
        print()
    else:
        print("\n❌ Failed to populate employee data")
        sys.exit(1)


if __name__ == "__main__":
    main()
