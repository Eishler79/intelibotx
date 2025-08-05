from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select
from db.database import engine
from models.bot_config import BotConfig
from typing import List, Optional
from pydantic import BaseModel
from services.backtest_bot import run_backtest_and_plot

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

# ============================
# Ejecutar Backtest de Bot
# ============================
@router.get("/api/backtest-results/{bot_id}")
def run_bot_backtest(bot_id: int):
    """Ejecuta backtest para un bot específico usando su configuración."""
    with Session(engine) as session:
        bot = session.get(BotConfig, bot_id)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot no encontrado")
        
        try:
            # Ejecutar backtest usando el símbolo del bot
            html_chart = run_backtest_and_plot(bot.symbol)
            
            return {
                "bot_id": bot_id,
                "symbol": bot.symbol,
                "status": "success",
                "message": "Backtest ejecutado correctamente",
                "chart_html": html_chart,
                "config": {
                    "symbol": bot.symbol,
                    "interval": bot.interval,
                    "stake": bot.stake,
                    "strategy": bot.strategy,
                    "take_profit": bot.take_profit,
                    "stop_loss": bot.stop_loss,
                    "dca_levels": bot.dca_levels
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al ejecutar backtest: {str(e)}")