### 📁 backend/db/database.py
from sqlmodel import create_engine, Session, SQLModel
import os
import logging

logger = logging.getLogger(__name__)

# ✅ DL-006 COMPLIANCE: No hardcode DATABASE_URL - usar variable entorno
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./intelibotx.db")  # Fallback solo para desarrollo local

# 🏗️ GUARDRAILS P3: Professional Database Connection Pooling
def create_database_engine():
    """Create database engine with professional connection pooling configuration"""
    try:
        if "postgresql" in DATABASE_URL:
            # 🐘 PostgreSQL Connection Pooling (Railway Production)
            engine = create_engine(
                DATABASE_URL,
                echo=False,
                # Connection pool settings for PostgreSQL
                pool_size=10,           # Base connections
                max_overflow=20,        # Additional connections during peak
                pool_timeout=30,        # Wait time for connection
                pool_recycle=3600,      # Recycle connections every hour
                pool_pre_ping=True,     # Validate connections before use
                # Additional PostgreSQL optimizations
                connect_args={
                    "connect_timeout": 10,
                    "application_name": "InteliBotX"
                }
            )
            logger.info("🐘 PostgreSQL engine created with connection pooling")
        else:
            # 🗄️ SQLite Configuration (Development)
            engine = create_engine(
                DATABASE_URL,
                echo=False,
                # SQLite-specific settings
                connect_args={
                    "check_same_thread": False,
                    "timeout": 20
                }
            )
            logger.info("🗄️ SQLite engine created for development")
        
        return engine
        
    except Exception as e:
        logger.error(f"❌ Failed to create database engine: {e}")
        raise RuntimeError(f"Database engine creation failed: {e}")

# Initialize engine with connection pooling
engine = create_database_engine()

def create_db_and_tables():
    """Initialize database tables"""
    from models.bot_config import BotConfig
    from models.user import User, UserSession
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session for dependency injection"""
    return Session(engine)