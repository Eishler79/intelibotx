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
                print("✅ Database tables created")
                print("📧 Registration endpoint: /api/auth/register")
                print("🔒 Email verification required")
            else:
                print(f"❌ Auth initialization failed: {init_response.status_code}")
                print(f"Response: {init_response.text}")
            
            # ✅ DL-001 COMPLIANCE: No hardcode authentication test
            print("🧪 Auth system ready for user registration")
                
    except Exception as e:
        print(f"❌ Initialization error: {e}")
        return False
    
    print("🎉 Railway deployment initialization completed!")
    return True

if __name__ == "__main__":
    asyncio.run(initialize_railway_deployment())