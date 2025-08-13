#!/usr/bin/env python3
"""
🔍 PostgreSQL Connection Tester - InteliBotX
Verificar conexión PostgreSQL antes de migración

Eduard Guzmán - InteliBotX
"""

import os
import sys
from datetime import datetime

# Add backend to path  
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

def test_postgresql_connection():
    """Test PostgreSQL connection with detailed diagnostics"""
    
    print("🔍 POSTGRESQL CONNECTION TEST")
    print("=" * 40)
    
    # Check DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False
    
    if "sqlite" in database_url.lower():
        print("⚠️ DATABASE_URL still points to SQLite")
        print(f"Current: {database_url}")
        return False
    
    print(f"🔗 PostgreSQL URL: {database_url[:50]}...")
    
    try:
        # Test SQLModel + PostgreSQL
        from sqlmodel import create_engine, SQLModel, Session
        
        print("✅ SQLModel imports successful")
        
        # Create engine
        engine = create_engine(database_url, echo=False)
        print("✅ PostgreSQL engine created")
        
        # Test connection
        with Session(engine) as session:
            from sqlmodel import text
            result = session.exec(text("SELECT version()")).first()
            print(f"✅ PostgreSQL connected: {result[:50]}...")
        
        # Test table creation
        from models.user import User
        from models.bot_config import BotConfig
        from models.user_exchange import UserExchange
        
        print("✅ Models imported successfully")
        
        # Create tables
        SQLModel.metadata.create_all(engine)
        print("✅ Tables created successfully")
        
        # Test simple insert/select
        with Session(engine) as session:
            # Test if tables exist
            from sqlmodel import text
            tables_query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            """)
            tables = session.exec(tables_query).all()
            print(f"✅ Tables found: {len(tables)} -> {list(tables)}")
        
        print()
        print("🎉 POSTGRESQL CONNECTION SUCCESSFUL")
        print("✅ Ready for migration!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Install required packages: pip install psycopg2-binary")
        return False
        
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def show_migration_instructions():
    """Show next steps for migration"""
    print()
    print("📋 NEXT STEPS FOR MIGRATION:")
    print("=" * 30)
    print("1. ✅ PostgreSQL connection verified")
    print("2. 🔄 Run migration script:")
    print("   cd scripts")  
    print("   python postgresql_migration.py")
    print("3. 🔄 Update production DATABASE_URL")
    print("4. 🔄 Deploy to Railway")
    print("5. 🔄 Verify E2E functionality")

if __name__ == "__main__":
    success = test_postgresql_connection()
    
    if success:
        show_migration_instructions()
    else:
        print()
        print("❌ Fix connection issues before migration")
        print("Check DATABASE_URL and PostgreSQL service")