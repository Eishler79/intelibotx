### 📁 intelibotx-api/models/bot_config.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class BotConfig(SQLModel, table=True):
    """
    Modelo para configuración de bots almacenado en SQLite.
    Cada bot pertenece a un usuario específico.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Usuario propietario (NUEVO - CRÍTICO)
    user_id: int = Field(foreign_key="user.id", index=True, description="ID del usuario propietario")
    
    # Exchange asociado (NUEVO - INTEGRACIÓN)
    exchange_id: Optional[int] = Field(default=None, foreign_key="userexchange.id", description="ID del exchange configurado del usuario")
    
    # Configuración básica del bot (MEJORADA)
    name: str = Field(description="Nombre personalizado del bot (ej. 'Bot Fuerte Austero')")
    symbol: str = Field(index=True, description="Par de trading, ejemplo: BTCUSDT")
    
    # Monedas y capital
    base_currency: str = Field(default="USDT", description="Moneda base para capital")
    quote_currency: str = Field(description="Moneda de beneficio (extraído de symbol)")
    stake: float = Field(description="Cantidad en moneda base a usar por operación")
    
    # Estrategia IA
    strategy: str = Field(description="Estrategia IA: Smart Scalper, Trend Hunter, etc.")
    interval: str = Field(description="Intervalo de tiempo (ej. 15m, 1h)")
    
    # Gestión de salida
    take_profit: float = Field(description="Porcentaje de ganancia objetivo")
    stop_loss: float = Field(description="Porcentaje de pérdida máxima aceptada")
    dca_levels: int = Field(default=3, description="Cantidad de niveles de DCA")
    risk_percentage: Optional[float] = Field(default=1.0, description="Porcentaje de riesgo por trade")
    
    # Tipo de mercado (MEJORADO)
    market_type: str = Field(
        default="SPOT",
        description="Tipo de mercado: SPOT, FUTURES_USDT, FUTURES_COIN, MARGIN_CROSS, MARGIN_ISOLATED"
    )
    
    # Configuración Futures (NUEVO)
    leverage: Optional[int] = Field(default=1, description="Apalancamiento para futures (1x = spot)")
    margin_type: Optional[str] = Field(default="ISOLATED", description="CROSS o ISOLATED para futures")
    
    # Condiciones avanzadas (NUEVO)
    min_volume: Optional[float] = Field(default=None, description="Volumen mínimo para operar")
    min_entry_price: Optional[float] = Field(default=None, description="Precio mínimo para entrada")
    max_orders_per_pair: int = Field(default=1, description="Máximo órdenes activas por par")
    
    # Estado y control
    active: bool = Field(default=True, description="Bot habilitado o no")
    status: str = Field(default="STOPPED", description="Estado actual: STOPPED, RUNNING, PAUSED, ERROR")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    last_trade_at: Optional[datetime] = Field(default=None)