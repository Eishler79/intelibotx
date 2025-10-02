from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class BotStatus(str, Enum):
    """Bot status enum following existing pattern"""
    STOPPED = "STOPPED"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    ERROR = "ERROR"

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
    base_currency: str = Field(description="Moneda base para capital - REQUERIDO por usuario")
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

    # Risk Profile Institucional (NUEVO - CORE_PHILOSOPHY BOT ÚNICO)
    # SPEC_REF: CORE_PHILOSOPHY.md#bot-concept (Bot adaptativo)
    risk_profile: str = Field(default="MODERATE", description="Perfil riesgo institucional: CONSERVATIVE, MODERATE, AGGRESSIVE - Bot ajusta algoritmos automáticamente")

    # Tipo de mercado (MEJORADO)
    market_type: str = Field(
        description="Tipo de mercado: SPOT, FUTURES_USDT, FUTURES_COIN, MARGIN_CROSS, MARGIN_ISOLATED - REQUERIDO por usuario"
    )

    # Configuración Futures (NUEVO)
    leverage: Optional[int] = Field(description="Apalancamiento para futures (1x = spot) - REQUERIDO")
    margin_type: Optional[str] = Field(description="CROSS o ISOLATED para futures - REQUERIDO")

    # Condiciones avanzadas (NUEVO)
    min_volume: Optional[float] = Field(default=0.0, description="Volumen mínimo para operar")
    min_entry_price: Optional[float] = Field(default=None, description="Precio mínimo para entrada")
    max_orders_per_pair: int = Field(default=1, description="Máximo órdenes activas por par")

    # Tipos de órdenes (NUEVO - CRÍTICO PARA ELIMINAR HARDCODING)
    entry_order_type: str = Field(description="Tipo orden entrada: MARKET, LIMIT, STOP_LIMIT - REQUERIDO")
    exit_order_type: str = Field(description="Tipo orden salida: MARKET, LIMIT - REQUERIDO")
    tp_order_type: str = Field(description="Tipo orden Take Profit: LIMIT, MARKET - REQUERIDO")
    sl_order_type: str = Field(description="Tipo orden Stop Loss: STOP_MARKET, STOP_LIMIT - REQUERIDO")
    trailing_stop: bool = Field(description="Activar trailing stop loss - REQUERIDO por usuario")

    # Controles operacionales (NUEVO - CRÍTICO PARA ELIMINAR HARDCODING)
    max_open_positions: int = Field(description="Máximo posiciones simultáneas del bot - REQUERIDO")
    cooldown_minutes: int = Field(description="Tiempo espera entre operaciones (minutos) - REQUERIDO")

    # Estado y control
    active: bool = Field(default=True, description="Bot habilitado o no")
    status: str = Field(default=BotStatus.STOPPED, description="Estado actual: STOPPED, RUNNING, PAUSED, ERROR")

    # Wyckoff Method Configuration (NUEVO - DL-113 GAP #3)
    # SPEC_REF: INSTITUTIONAL_ALGORITHMS/01_WYCKOFF_METHOD.md
    wyckoff_prior_trend_bars: int = Field(default=10, description="Barras para detectar tendencia previa")
    wyckoff_volume_increase_factor: float = Field(default=1.5, description="Factor incremento volumen para detección")
    wyckoff_vol_increase_factor: float = Field(default=1.5, description="Factor incremento volumen PS/PSY")
    wyckoff_atr_factor: float = Field(default=0.5, description="Factor ATR para zona soporte/resistencia")
    wyckoff_support_touches_min: int = Field(default=2, description="Toques mínimos soporte PS")
    wyckoff_resistance_touches_min: int = Field(default=2, description="Toques mínimos resistencia PSY")
    wyckoff_rebound_threshold: float = Field(default=0.02, description="Umbral rebote PS (2%)")
    wyckoff_rejection_threshold: float = Field(default=0.02, description="Umbral rechazo PSY (2%)")
    wyckoff_vol_climax_factor: float = Field(default=2.0, description="Factor volumen climático SC/BC")
    wyckoff_wick_size_min: float = Field(default=1.5, description="Tamaño mínimo mecha SC/BC en ATRs")
    wyckoff_ar_rebound_pct: float = Field(default=0.03, description="Porcentaje rebote AR acumulación (3%)")
    wyckoff_ar_decline_pct: float = Field(default=0.03, description="Porcentaje caída AR distribución (3%)")
    wyckoff_near_threshold: float = Field(default=0.01, description="Umbral cercanía ST (1%)")
    wyckoff_vol_reduced_factor: float = Field(default=0.5, description="Factor reducción volumen ST")
    wyckoff_test_atr_factor: float = Field(default=0.3, description="Factor ATR test LPS/LPSY")
    wyckoff_strong_close_factor: float = Field(default=0.5, description="Factor cierre fuerte LPS en ATRs")
    wyckoff_weak_close_factor: float = Field(default=0.5, description="Factor cierre débil LPSY en ATRs")
    wyckoff_breakout_threshold: float = Field(default=0.01, description="Umbral breakout SOS (1%)")
    wyckoff_breakdown_threshold: float = Field(default=0.01, description="Umbral breakdown SOW (1%)")
    wyckoff_vol_surge_factor: float = Field(default=1.8, description="Factor incremento volumen SOS/SOW")
    wyckoff_resistance_clear_factor: float = Field(default=0.5, description="Factor resistencia superada SOS")
    wyckoff_support_broken_factor: float = Field(default=0.5, description="Factor soporte roto SOW")
    wyckoff_pullback_threshold: float = Field(default=0.02, description="Umbral pullback BU (2%)")
    wyckoff_vol_dry_factor: float = Field(default=0.3, description="Factor volumen seco BU")
    wyckoff_support_tolerance: float = Field(default=0.2, description="Tolerancia soporte BU markup en ATRs")
    wyckoff_resistance_tolerance: float = Field(default=0.2, description="Tolerancia resistencia BU markdown en ATRs")
    wyckoff_jump_threshold: float = Field(default=0.02, description="Umbral salto JOC (2%)")
    wyckoff_vol_expansion_factor: float = Field(default=1.5, description="Factor expansión volumen JOC")
    wyckoff_momentum_factor: float = Field(default=0.5, description="Factor momentum JOC en ATRs")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    last_trade_at: Optional[datetime] = Field(default=None)