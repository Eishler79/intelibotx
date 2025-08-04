### 📁 intelibotx-api/db/database.py
from sqlmodel import create_engine, Session, SQLModel

DATABASE_URL = "sqlite:///./bots.db"
engine = create_engine(DATABASE_URL, echo=False)

def create_db_and_tables():
    from models.bot_config import BotConfig
    SQLModel.metadata.create_all(engine)

def get_session():
    return Session(engine)