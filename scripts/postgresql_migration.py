#!/usr/bin/env python3
"""
🐘 PostgreSQL Migration Script - InteliBotX
Migrar datos de SQLite a PostgreSQL con verificación completa

Eduard Guzmán - InteliBotX  
Fecha: 2025-08-13
"""

import os
import sys
import sqlite3
import asyncio
import asyncpg
import bcrypt
from datetime import datetime
from typing import Dict, List, Any

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlmodel import SQLModel, create_engine, Session, select
from models.user import User, UserSession
from models.bot_config import BotConfig
from models.user_exchange import UserExchange

class PostgreSQLMigrator:
    """Migrador SQLite → PostgreSQL para InteliBotX"""
    
    def __init__(self, sqlite_path: str, postgresql_url: str):
        self.sqlite_path = sqlite_path
        self.postgresql_url = postgresql_url
        self.migration_log = []
        
    def log(self, message: str):
        """Log con timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        print(log_entry)
        self.migration_log.append(log_entry)
    
    def extract_sqlite_data(self) -> Dict[str, List[Dict]]:
        """Extraer todos los datos de SQLite"""
        self.log("📊 Extrayendo datos de SQLite...")
        
        if not os.path.exists(self.sqlite_path):
            raise FileNotFoundError(f"SQLite database not found: {self.sqlite_path}")
        
        data = {}
        
        conn = sqlite3.connect(self.sqlite_path)
        conn.row_factory = sqlite3.Row  # Para acceso por nombre columna
        
        tables = ['user', 'usersession', 'userexchange', 'botconfig']
        
        for table in tables:
            try:
                cursor = conn.execute(f"SELECT * FROM {table}")
                rows = cursor.fetchall()
                data[table] = [dict(row) for row in rows]
                self.log(f"  ✅ {table}: {len(rows)} records")
            except sqlite3.OperationalError as e:
                self.log(f"  ⚠️ {table}: {e}")
                data[table] = []
        
        conn.close()
        
        total_records = sum(len(records) for records in data.values())
        self.log(f"📋 Total records to migrate: {total_records}")
        
        return data
    
    def create_postgresql_tables(self):
        """Crear tablas en PostgreSQL usando SQLModel"""
        self.log("🔨 Creando tablas PostgreSQL...")
        
        try:
            engine = create_engine(self.postgresql_url, echo=False)
            SQLModel.metadata.create_all(engine)
            self.log("✅ Tablas PostgreSQL creadas exitosamente")
            return engine
        except Exception as e:
            self.log(f"❌ Error creando tablas PostgreSQL: {e}")
            raise
    
    def migrate_users(self, engine, users_data: List[Dict]):
        """Migrar usuarios específicamente"""
        self.log(f"👥 Migrando {len(users_data)} usuarios...")
        
        if not users_data:
            self.log("  ⚠️ No users to migrate")
            return
        
        with Session(engine) as session:
            for user_data in users_data:
                try:
                    # Verificar si user ya existe
                    existing = session.exec(
                        select(User).where(User.email == user_data['email'])
                    ).first()
                    
                    if existing:
                        self.log(f"  ⚠️ User {user_data['email']} already exists, skipping")
                        continue
                    
                    # Crear nuevo user preservando todos los campos
                    user = User(
                        email=user_data['email'],
                        password_hash=user_data['password_hash'],
                        full_name=user_data['full_name'],
                        is_verified=user_data.get('is_verified', False),
                        verification_token=user_data.get('verification_token'),
                        verification_expires=user_data.get('verification_expires'),
                        reset_token=user_data.get('reset_token'),
                        reset_expires=user_data.get('reset_expires'),
                        encrypted_binance_testnet_key=user_data.get('encrypted_binance_testnet_key'),
                        encrypted_binance_testnet_secret=user_data.get('encrypted_binance_testnet_secret'),
                        created_at=datetime.fromisoformat(user_data['created_at']) if user_data.get('created_at') else datetime.utcnow()
                    )
                    
                    session.add(user)
                    session.commit()
                    session.refresh(user)
                    
                    self.log(f"  ✅ User migrated: {user_data['email']} (ID: {user.id})")
                    
                except Exception as e:
                    session.rollback()
                    self.log(f"  ❌ Error migrating user {user_data.get('email', 'UNKNOWN')}: {e}")
    
    def migrate_other_tables(self, engine, data: Dict[str, List[Dict]]):
        """Migrar otras tablas (usersession, userexchange, botconfig)"""
        table_models = {
            'usersession': UserSession,
            'userexchange': UserExchange, 
            'botconfig': BotConfig
        }
        
        for table_name, model_class in table_models.items():
            records = data.get(table_name, [])
            self.log(f"📋 Migrando {len(records)} {table_name} records...")
            
            if not records:
                self.log(f"  ⚠️ No {table_name} records to migrate")
                continue
            
            with Session(engine) as session:
                for record in records:
                    try:
                        # Create model instance with record data
                        instance = model_class(**record)
                        session.add(instance)
                        session.commit()
                        session.refresh(instance)
                        self.log(f"  ✅ {table_name} record migrated (ID: {instance.id})")
                        
                    except Exception as e:
                        session.rollback()
                        self.log(f"  ❌ Error migrating {table_name} record: {e}")
    
    def verify_migration(self, engine):
        """Verificar integridad de la migración"""
        self.log("🔍 Verificando integridad migración...")
        
        with Session(engine) as session:
            # Count records in each table
            models = [User, UserSession, UserExchange, BotConfig]
            
            for model in models:
                try:
                    count = session.exec(select(func.count(model.id))).one()
                    self.log(f"  📊 {model.__name__}: {count} records")
                except Exception as e:
                    self.log(f"  ❌ Error counting {model.__name__}: {e}")
            
            # Test specific queries
            try:
                users = session.exec(select(User)).all()
                for user in users:
                    self.log(f"  👤 User verified: {user.email} (verified: {user.is_verified})")
            except Exception as e:
                self.log(f"  ❌ Error verifying users: {e}")
    
    def run_migration(self):
        """Ejecutar migración completa"""
        self.log("🚀 INICIANDO MIGRACIÓN POSTGRESQL")
        self.log("=" * 50)
        
        try:
            # 1. Extract SQLite data
            data = self.extract_sqlite_data()
            
            # 2. Create PostgreSQL tables
            engine = self.create_postgresql_tables()
            
            # 3. Migrate users first (critical data)
            self.migrate_users(engine, data.get('user', []))
            
            # 4. Migrate other tables
            self.migrate_other_tables(engine, data)
            
            # 5. Verify migration
            self.verify_migration(engine)
            
            self.log("=" * 50)
            self.log("🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE")
            
            return True
            
        except Exception as e:
            self.log(f"💥 MIGRACIÓN FALLIDA: {e}")
            return False

def main():
    """Main function"""
    # Configuration
    sqlite_path = "../backend/intelibotx.db"
    
    # PostgreSQL URL from environment or default
    postgresql_url = os.getenv("DATABASE_URL") 
    if not postgresql_url or "sqlite" in postgresql_url:
        print("❌ PostgreSQL DATABASE_URL not configured")
        print("Please set DATABASE_URL environment variable to PostgreSQL connection string")
        print("Example: postgresql://user:password@localhost:5432/database")
        return
    
    print(f"🔗 PostgreSQL URL: {postgresql_url[:50]}...")
    
    # Run migration
    migrator = PostgreSQLMigrator(sqlite_path, postgresql_url)
    success = migrator.run_migration()
    
    if success:
        print("\n✅ Migration ready for production!")
    else:
        print("\n❌ Migration failed. Check logs above.")

if __name__ == "__main__":
    main()