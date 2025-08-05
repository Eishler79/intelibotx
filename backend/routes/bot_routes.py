from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select
from db.database import engine
from models.bot_config import BotConfig
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

# ============================
# Pydantic para entrada / salida
# ============================
class BotCreateRequest(BaseModel):
    symbol: str
    interval: str
    stake: float
    strategy: str
    take_profit: Optional[float] = 2.0
    stop_loss: Optional[float] = 1.0
    dca_levels: Optional[int] = 3
    active: Optional[bool] = True

# ============================
# Crear Bot
# ============================
@router.post("/api/create-bot", response_model=BotConfig)
def create_bot(config: BotCreateRequest):
    with Session(engine) as session:
        bot = BotConfig(**config.dict())
        session.add(bot)
        session.commit()
        session.refresh(bot)
        return bot

# ============================
# Obtener todos los Bots
# ============================
@router.get("/api/bots", response_model=List[BotConfig])
def get_all_bots():
    with Session(engine) as session:
        bots = session.exec(select(BotConfig)).all()
        return bots

# ============================
# Obtener Bot por ID
# ============================
@router.get("/api/bots/{bot_id}", response_model=BotConfig)
def get_bot(bot_id: int):
    with Session(engine) as session:
        bot = session.get(BotConfig, bot_id)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot no encontrado")
        return bot

# ============================
# Actualizar Bot
# ============================
@router.put("/api/bots/{bot_id}", response_model=BotConfig)
def update_bot(bot_id: int, updated_config: BotCreateRequest):
    with Session(engine) as session:
        bot = session.get(BotConfig, bot_id)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot no encontrado")
        for key, value in updated_config.dict().items():
            setattr(bot, key, value)
        session.add(bot)
        session.commit()
        session.refresh(bot)
        return bot

# ============================
# Eliminar Bot
# ============================
@router.delete("/api/bots/{bot_id}")
def delete_bot(bot_id: int):
    with Session(engine) as session:
        bot = session.get(BotConfig, bot_id)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot no encontrado")
        session.delete(bot)
        session.commit()
        return {"message": f"Bot {bot_id} eliminado correctamente"}