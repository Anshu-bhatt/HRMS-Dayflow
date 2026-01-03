#!/usr/bin/env python3
"""
Test script to verify Firebase token verification is working correctly.
This helps diagnose why tokens from the frontend are being rejected.
"""

import firebase_admin
from firebase_admin import credentials, auth
import sys

def test_firebase_init():
    """Test Firebase initialization"""
    print("[TEST] Testing Firebase initialization...")
    try:
        if firebase_admin._apps:
            print("[TEST] Firebase app already initialized, deleting...")
            firebase_admin.delete_app(firebase_admin._apps[0])
        
        cred = credentials.Certificate("firebase_credentials.json")
        firebase_admin.initialize_app(cred)
        print("[SUCCESS] Firebase initialized successfully")
        print(f"[SUCCESS] Project ID: {cred.project_id}")
        return True
    except Exception as e:
        print(f"[ERROR] Firebase initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_token_verification(token: str):
    """Test token verification"""
    print(f"\n[TEST] Testing token verification...")
    print(f"[TEST] Token length: {len(token)}")
    print(f"[TEST] Token first 20 chars: {token[:20]}...")
    print(f"[TEST] Token last 20 chars: ...{token[-20:]}")
    
    try:
        decoded = auth.verify_id_token(token)
        print(f"[SUCCESS] Token verified successfully!")
        print(f"[SUCCESS] UID: {decoded.get('uid')}")
        print(f"[SUCCESS] Email: {decoded.get('email')}")
        print(f"[SUCCESS] Token keys: {list(decoded.keys())}")
        return True
    except auth.ExpiredIdTokenError as e:
        print(f"[ERROR] Token expired: {e}")
        return False
    except auth.InvalidIdTokenError as e:
        print(f"[ERROR] Invalid token: {e}")
        return False
    except auth.CertificateError as e:
        print(f"[ERROR] Certificate error: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Token verification failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Test initialization
    if not test_firebase_init():
        sys.exit(1)
    
    # If a token is provided as argument, test it
    if len(sys.argv) > 1:
        token = sys.argv[1]
        if not test_token_verification(token):
            sys.exit(1)
    else:
        print("\n[INFO] No token provided. To test a token, run:")
        print("[INFO]   python test_token_verification.py <token>")
