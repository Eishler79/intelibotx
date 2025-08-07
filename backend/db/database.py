### 📁 backend/db/database.py
from sqlmodel import create_engine, Session, SQLModel

DATABASE_URL = "sqlite:///./intelibotx.db"
engine = create_engine(DATABASE_URL, echo=False)

def create_db_and_tables():
    """Initialize database tables"""
    from models.bot_config import BotConfig
    from models.user import User, UserSession
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session for dependency injection"""
    return Session(engine)