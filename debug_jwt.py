#!/usr/bin/env python3
"""Debug JWT token from Supabase"""
import requests
import os
import jwt
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
SUPABASE_ANON_KEY = os.environ.get('REACT_APP_SUPABASE_ANON_KEY')
SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET')

print("=== Supabase JWT Debug ===\n")
print(f"Supabase URL: {SUPABASE_URL}")
print(f"JWT Secret (first 20 chars): {SUPABASE_JWT_SECRET[:20]}...")

# Sign in to get token
print("\n1. Signing in to get access token...")
response = requests.post(
    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
    headers={
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    },
    json={
        "email": "tester@modsyndicate.test",
        "password": "TestPass123!"
    }
)

if response.status_code == 200:
    auth_data = response.json()
    access_token = auth_data.get('access_token')
    print(f"✅ Got access token: {access_token[:50]}...")
    
    # Decode without verification to see the payload
    print("\n2. Decoding token (no verification)...")
    try:
        unverified = jwt.decode(access_token, options={"verify_signature": False})
        print(f"✅ Token payload:")
        print(f"   Algorithm (from header): {jwt.get_unverified_header(access_token)}")
        print(f"   Subject (sub): {unverified.get('sub')}")
        print(f"   Email: {unverified.get('email')}")
        print(f"   Audience (aud): {unverified.get('aud')}")
        print(f"   Issuer (iss): {unverified.get('iss')}")
        print(f"   Role: {unverified.get('role')}")
    except Exception as e:
        print(f"❌ Error decoding: {e}")
    
    # Try to verify with HS256
    print("\n3. Verifying with HS256 algorithm...")
    try:
        verified = jwt.decode(
            access_token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True}
        )
        print(f"✅ Token verified successfully with HS256!")
        print(f"   User ID: {verified.get('sub')}")
    except jwt.InvalidSignatureError as e:
        print(f"❌ Invalid signature: {e}")
        print("   This means the JWT secret doesn't match or wrong algorithm")
    except jwt.InvalidAudienceError as e:
        print(f"❌ Invalid audience: {e}")
        print(f"   Expected 'authenticated', got: {unverified.get('aud')}")
    except Exception as e:
        print(f"❌ Verification failed: {e}")
    
    # Try with ES256 (Supabase might use this)
    print("\n4. Checking if token uses ES256 (asymmetric)...")
    header = jwt.get_unverified_header(access_token)
    if header.get('alg') == 'ES256':
        print("⚠️  Token uses ES256 algorithm (asymmetric)")
        print("   This requires a public key, not a secret")
        print("   The SUPABASE_JWT_SECRET should be the public key for ES256")
    
else:
    print(f"❌ Failed to sign in: {response.status_code}")
    print(response.text)
