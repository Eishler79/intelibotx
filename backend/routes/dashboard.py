from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from datetime import datetime

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/dashboard")
async def render_dashboard(request: Request):
    # Simulaciones temporales para pruebas
    news_list = [
        {"title": "⚡ ETF impacta BTC", "symbol": "BTC", "source": "Simulado"},
        {"title": "⚡ Regulation impacta ETH", "symbol": "ETH", "source": "Simulado"},
    ]

    economic_events = [
        {"title": "📊 NFP Payroll", "date": "2025-07-05", "impact": "Alto"},
        {"title": "🧾 CPI Report", "date": "2025-07-07", "impact": "Medio"},
    ]

    summary = [
        {"symbol": "BTC/USDT", "action": "BUY", "status": "Abierto", "stake": 40, "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M")},
        {"symbol": "ETH/USDT", "action": "SELL", "status": "Cerrado", "stake": 30, "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M")},
    ]

    operations = [
        {"timestamp": "2025-07-03 14:00", "symbol": "BTC/USDT", "interval": "15m", "stake": 40, "action": "BUY", "reason": "RSI + MACD", "status": "Ejecutado"},
        {"timestamp": "2025-07-03 15:30", "symbol": "ETH/USDT", "interval": "15m", "stake": 30, "action": "SELL", "reason": "Trailing TP", "status": "Cerrado"},
    ]

    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "news_list": news_list,
        "economic_events": economic_events,
        "summary": summary,
        "operations": operations,
    })