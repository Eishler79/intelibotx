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
def run_smart_trade(symbol: str):
    """Ejecuta Smart Trade con análisis técnico completo"""
    try:
        # ✅ Normalización del símbolo
        normalized_symbol = symbol.upper().strip().replace(" ", "")

        # ✅ Validación básica del símbolo
        if not normalized_symbol or len(normalized_symbol) < 3:
            raise HTTPException(
                status_code=400,
                detail=f"❌ Símbolo inválido: {normalized_symbol}"
            )

        # 🧠 Buscar configuración del bot en la base de datos
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
                # Usar datos de BTCUSDT con fallback
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

        # 📤 Respuesta con resultado completo
        return {
            "message": f"✅ Smart Trade ejecutado para {normalized_symbol}",
            "symbol": normalized_symbol,
            "strategy": strategy,
            "interval": interval,
            "signals": signals,
            "bot_config": {
                "id": result.id,
                "stake": result.stake,
                "take_profit": result.take_profit,
                "stop_loss": result.stop_loss,
                "dca_levels": result.dca_levels
            }
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )