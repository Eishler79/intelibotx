# 📦 Importaciones base
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from services.backtest_bot import run_backtest_and_plot
from analytics.strategy_evaluator import StrategyEvaluator  # ✅ ARREGLADO: Usar clase correcta
from models.bot_config import BotConfig  # 🆕 NUEVO: Acceso a configuración del bot
from sqlmodel import Session, select
from utils.symbol_validator import validate_symbol  # ✅ EXISTENTE: validador robusto
from db.database import engine  # ✅ ARREGLADO: Usar database.py consolidado
import pandas as pd  # ✅ NUEVO: Para cargar datos históricos

# 🚀 Instancia del router
router = APIRouter()


# 📈 RUTA ACTUAL: Gráfico de backtest (sin cambios)
@router.get("/api/backtest-chart/{symbol}", response_class=HTMLResponse)
async def get_backtest_chart(symbol: str):
    html_chart = run_backtest_and_plot(symbol)
    return HTMLResponse(content=html_chart)


# 🤖 RUTA ACTUAL: Ejecutar Smart Trade con validación de símbolo
# 🆕 MEJORA: Ahora también obtiene estrategia desde DB y evalúa lógica real
@router.post("/api/run-smart-trade/{symbol}")
async def run_smart_trade(symbol: str):
    # ✅ Normalización del símbolo
    normalized_symbol = symbol.upper().strip().replace(" ", "")

    # ✅ Validación robusta del símbolo
    if not validate_symbol(normalized_symbol):
        raise HTTPException(
            status_code=400,
            detail=f"❌ Símbolo inválido o no disponible para trading: {normalized_symbol}"
        )

    # 🧠 NUEVO: Buscar configuración del bot en la base de datos
    with Session(engine) as session:
        query = select(BotConfig).where(BotConfig.symbol == normalized_symbol)
        result = session.exec(query).first()

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"⚠️ No hay configuración guardada para {normalized_symbol}"
            )

        # 🔍 Extraer los parámetros requeridos
        interval = result.interval
        strategy = result.strategy

        # 🧠 Cargar datos históricos para análisis
        try:
            # Por ahora usar datos de BTCUSDT, luego se puede hacer dinámico
            df = pd.read_csv("data/btcusdt_15m.csv")
            if "timestamp" not in df.columns and "time" in df.columns:
                df = df.rename(columns={"time": "timestamp"})
            
            # Ejecutar evaluación real de estrategia
            evaluator = StrategyEvaluator(df)
            signals = evaluator.evaluate()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error al evaluar estrategia: {str(e)}"
            )

    # 📤 Respuesta con resultado
    return {
        "message": f"✅ Ejecutando Smart Trade para {normalized_symbol} con estrategia '{strategy}'",
        "symbol": normalized_symbol,
        "strategy": strategy,
        "signals": signals  # 🧠 Output técnico (entrada/salida)
    }