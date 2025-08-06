### 📁 intelibotx-api/models/bot_config.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class BotConfig(SQLModel, table=True):
    """
    Modelo para configuración de bots almacenado en SQLite.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    symbol: str = Field(index=True, description="Par de trading, ejemplo: BTCUSDT")
    stake: float = Field(description="Cantidad en USD o USDT a usar por operación")
    strategy: str = Field(description="Nombre de la estrategia (ej. Smart Scalper, Trend Hunter)")
    interval: str = Field(description="Intervalo de tiempo (ej. 15m, 1h)")
    take_profit: float = Field(description="Porcentaje de ganancia objetivo")
    stop_loss: float = Field(description="Porcentaje de pérdida máxima aceptada")
    dca_levels: int = Field(default=3, description="Cantidad de niveles de DCA")
    risk_percentage: Optional[float] = Field(default=1.0, description="Porcentaje de riesgo por trade")
    market_type: Optional[str] = Field(default="spot", description="Tipo de mercado: spot o futures")
    active: bool = Field(default=True, description="Bot habilitado o no")
    created_at: datetime = Field(default_factory=datetime.utcnow)