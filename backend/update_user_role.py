#!/usr/bin/env python3
"""
Helper script to update a user's role in Firestore
Usage: python update_user_role.py <uid> <new_role>
Example: python update_user_role.py D3ufE3ena9U0D92zuxIYuilpR4u1 admin
"""

import sys
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase_credentials.json")
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase initialized successfully")
except Exception as e:
    print(f"❌ Firebase initialization failed: {e}")
    sys.exit(1)

def update_user_role(uid, new_role):
    """Update a user's role in Firestore"""
    try:
        # Get current user data
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            print(f"❌ User with UID '{uid}' not found")
            return False
        
        current_data = user_doc.to_dict()
        print(f"📝 Current user data: {current_data}")
        
        # Update role
        user_ref.update({"role": new_role})
        print(f"✅ Successfully updated role to '{new_role}'")
        
        # Verify update
        updated_doc = user_ref.get()
        updated_data = updated_doc.to_dict()
        print(f"✅ Verified new role: {updated_data.get('role')}")
        
        return True
    except Exception as e:
        print(f"❌ Error updating role: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python update_user_role.py <uid> <new_role>")
        print("Example: python update_user_role.py D3ufE3ena9U0D92zuxIYuilpR4u1 admin")
        sys.exit(1)
    
    uid = sys.argv[1]
    new_role = sys.argv[2]
    
    if new_role not in ['admin', 'employee']:
        print(f"❌ Invalid role '{new_role}'. Use 'admin' or 'employee'")
        sys.exit(1)
    
    print(f"🔄 Updating user '{uid}' role to '{new_role}'...")
    success = update_user_role(uid, new_role)
    
    sys.exit(0 if success else 1)
