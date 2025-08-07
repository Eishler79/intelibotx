#!/usr/bin/env python3
"""
Script de inicialización automática para Railway deployment
Configura la base de datos y crea el admin user automáticamente
"""
import asyncio
import httpx
import os
from datetime import datetime

async def initialize_railway_deployment():
    """Initialize Railway deployment with auth system"""
    
    # Get Railway URL from environment or use default
    railway_url = os.getenv("RAILWAY_STATIC_URL", "http://localhost:8000")
    
    print(f"🚀 Initializing Railway deployment: {railway_url}")
    print(f"⏰ Timestamp: {datetime.now()}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test basic health
            print("🔍 Testing health endpoint...")
            health_response = await client.get(f"{railway_url}/api/health")
            print(f"✅ Health check: {health_response.status_code}")
            
            # Initialize auth system
            print("🔐 Initializing authentication system...")
            init_response = await client.post(f"{railway_url}/api/init-auth-only")
            
            if init_response.status_code == 200:
                result = init_response.json()
                print("✅ Auth system initialized successfully!")
                print(f"📧 Admin email: {result.get('admin_email', 'admin@intelibotx.com')}")
                print(f"🔑 Admin password: {result.get('admin_password', 'admin123')}")
                print(f"🏦 API keys configured: {result.get('api_keys_configured', False)}")
            else:
                print(f"❌ Auth initialization failed: {init_response.status_code}")
                print(f"Response: {init_response.text}")
            
            # Test authentication flow
            print("🧪 Testing authentication flow...")
            login_data = {
                "email": "admin@intelibotx.com", 
                "password": "admin123"
            }
            
            login_response = await client.post(
                f"{railway_url}/api/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if login_response.status_code == 200:
                login_result = login_response.json()
                print("✅ Authentication test successful!")
                print(f"🎫 Token generated: {login_result.get('auth', {}).get('access_token', '')[:50]}...")
                
                # Test protected endpoint
                token = login_result.get('auth', {}).get('access_token')
                if token:
                    headers = {"Authorization": f"Bearer {token}"}
                    user_response = await client.get(f"{railway_url}/api/auth/me", headers=headers)
                    
                    if user_response.status_code == 200:
                        user_data = user_response.json()
                        print(f"👤 User info retrieved: {user_data.get('email')}")
                        print(f"🔑 API keys configured: {user_data.get('api_keys_configured')}")
                    else:
                        print(f"⚠️ User info failed: {user_response.status_code}")
                        
            else:
                print(f"❌ Authentication test failed: {login_response.status_code}")
                print(f"Response: {login_response.text}")
                
    except Exception as e:
        print(f"❌ Initialization error: {e}")
        return False
    
    print("🎉 Railway deployment initialization completed!")
    return True

if __name__ == "__main__":
    asyncio.run(initialize_railway_deployment())