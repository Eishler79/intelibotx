"""
📊 Dashboard Data API - Datos Reales para Dashboard
Proporciona métricas en tiempo real de bots, balance, PnL y gráficos
"""

from fastapi import APIRouter, Query, HTTPException, Header, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict

# Lazy imports to avoid psycopg2 dependency at module level

router = APIRouter()

@router.get("/api/dashboard/summary")
async def get_dashboard_summary(
    authorization: str = Header(None)
):
    """
    📊 Resumen completo del dashboard con datos reales
    
    Reemplaza todos los valores hardcodeados del Dashboard.jsx
    """
    try:
        # Lazy imports
        from db.database import get_session
        from services.auth_service import get_current_user_safe
        from models.bot_config import BotConfig
        from routes.trading_operations import TradingOperation
        from sqlmodel import select
        from fastapi import HTTPException, status, Header
        import logging
        
        logger = logging.getLogger(__name__)
        
        # DL-003 COMPLIANT: Authentication via dependency function
        current_user = await get_current_user_safe(authorization)
        session = get_session()
        
        # 🤖 Obtener bots del usuario
        bots_query = select(BotConfig).where(BotConfig.user_id == current_user.id)
        bots = session.exec(bots_query).all()
        
        active_bots = len([bot for bot in bots if bot.status == 'RUNNING'])
        total_bots = len(bots)
        
        # 💰 Calcular balance total inicial
        initial_capital = sum(float(bot.stake or 0) for bot in bots)
        
        # 📊 Obtener operaciones del usuario (últimos 30 días)
        operations_query = select(TradingOperation).where(
            TradingOperation.user_id == current_user.id,
            TradingOperation.created_at >= datetime.utcnow() - timedelta(days=30)
        )
        operations = session.exec(operations_query).all()
        
        # 📈 Calcular métricas PnL
        total_pnl = sum(op.pnl for op in operations)
        today_operations = [op for op in operations if op.created_at.date() == datetime.utcnow().date()]
        today_pnl = sum(op.pnl for op in today_operations)
        
        # 💵 Balance actual = Capital inicial + PnL total
        current_balance = initial_capital + total_pnl
        
        # 📊 Operaciones por símbolo
        symbol_pnl = defaultdict(float)
        for op in operations:
            symbol_pnl[op.symbol] += op.pnl
        
        # 🎯 Win rate
        profitable_ops = len([op for op in operations if op.pnl > 0])
        total_ops = len(operations)
        win_rate = (profitable_ops / total_ops * 100) if total_ops > 0 else 0
        
        # 📈 Performance últimos 7 días
        last_7_days = []
        for i in range(7):
            day = datetime.utcnow() - timedelta(days=i)
            day_ops = [op for op in operations if op.created_at.date() == day.date()]
            day_pnl = sum(op.pnl for op in day_ops)
            last_7_days.append({
                "date": day.strftime("%Y-%m-%d"),
                "pnl": round(day_pnl, 2),
                "operations": len(day_ops)
            })
        
        last_7_days.reverse()  # Orden cronológico
        
        return {
            "success": True,
            "summary": {
                # Métricas principales
                "active_bots": active_bots,
                "total_bots": total_bots,
                "initial_capital": round(initial_capital, 2),
                "current_balance": round(current_balance, 2),
                "total_pnl": round(total_pnl, 2),
                "today_pnl": round(today_pnl, 2),
                "total_operations": total_ops,
                "today_operations": len(today_operations),
                "win_rate": round(win_rate, 1),
                
                # Performance por símbolo (top 5)
                "top_symbols": dict(sorted(symbol_pnl.items(), key=lambda x: x[1], reverse=True)[:5]),
                
                # Datos para gráfico
                "last_7_days": last_7_days,
                
                # Status
                "last_updated": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard data: {str(e)}")

@router.get("/api/dashboard/balance-evolution")
async def get_balance_evolution(
    days: int = Query(30, ge=1, le=365),
    symbol: Optional[str] = Query(None),
    authorization: str = Header(None)
):
    """
    📈 Evolución del balance con filtros por días y símbolo
    
    Para gráficos dinámicos: global, por día, por par de moneda
    """
    try:
        # Lazy imports
        from db.database import get_session
        from services.auth_service import get_current_user_safe
        from models.bot_config import BotConfig
        from routes.trading_operations import TradingOperation
        from sqlmodel import select
        
        # DL-003 COMPLIANT: Authentication via dependency function
        current_user = await get_current_user_safe(authorization)
        session = get_session()
        
        # Query base
        query = select(TradingOperation).where(
            TradingOperation.user_id == current_user.id,
            TradingOperation.created_at >= datetime.utcnow() - timedelta(days=days)
        ).order_by(TradingOperation.created_at)
        
        # Filtro por símbolo si se especifica
        if symbol:
            query = query.where(TradingOperation.symbol == symbol)
        
        operations = session.exec(query).all()
        
        # Capital inicial de los bots
        bots_query = select(BotConfig).where(BotConfig.user_id == current_user.id)
        bots = session.exec(bots_query).all()
        initial_capital = sum(float(bot.stake or 0) for bot in bots)
        
        # Construir evolución día por día
        daily_balance = {}
        running_pnl = 0
        
        for op in operations:
            date_key = op.created_at.date().isoformat()
            running_pnl += op.pnl
            daily_balance[date_key] = {
                "date": date_key,
                "balance": round(initial_capital + running_pnl, 2),
                "pnl": round(running_pnl, 2),
                "operations": daily_balance.get(date_key, {}).get("operations", 0) + 1
            }
        
        # Completar días sin operaciones
        current_date = datetime.utcnow() - timedelta(days=days)
        complete_evolution = []
        current_balance = initial_capital
        
        for i in range(days + 1):
            date_key = current_date.date().isoformat()
            
            if date_key in daily_balance:
                current_balance = daily_balance[date_key]["balance"]
                complete_evolution.append(daily_balance[date_key])
            else:
                complete_evolution.append({
                    "date": date_key,
                    "balance": round(current_balance, 2),
                    "pnl": round(current_balance - initial_capital, 2),
                    "operations": 0
                })
            
            current_date += timedelta(days=1)
        
        return {
            "success": True,
            "evolution": complete_evolution,
            "initial_capital": round(initial_capital, 2),
            "current_balance": round(complete_evolution[-1]["balance"], 2),
            "total_pnl": round(complete_evolution[-1]["pnl"], 2),
            "period_days": days,
            "symbol_filter": symbol
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching balance evolution: {str(e)}")

@router.get("/api/dashboard/bots-performance")
async def get_bots_performance(
    days: int = Query(7, ge=1, le=90),
    authorization: str = Header(None)
):
    """
    🤖 Performance individual de cada bot con métricas reales
    """
    try:
        # Lazy imports
        from db.database import get_session
        from services.auth_service import get_current_user_safe
        from models.bot_config import BotConfig
        from routes.trading_operations import TradingOperation
        from sqlmodel import select
        
        # DL-003 COMPLIANT: Authentication via dependency function
        current_user = await get_current_user_safe(authorization)
        session = get_session()
        
        # Obtener bots del usuario
        bots_query = select(BotConfig).where(BotConfig.user_id == current_user.id)
        bots = session.exec(bots_query).all()
        
        bot_performance = []
        
        for bot in bots:
            # Operaciones del bot
            ops_query = select(TradingOperation).where(
                TradingOperation.bot_id == bot.id,
                TradingOperation.user_id == current_user.id,
                TradingOperation.created_at >= datetime.utcnow() - timedelta(days=days)
            )
            operations = session.exec(ops_query).all()
            
            # Métricas del bot
            total_pnl = sum(op.pnl for op in operations)
            total_ops = len(operations)
            profitable_ops = len([op for op in operations if op.pnl > 0])
            win_rate = (profitable_ops / total_ops * 100) if total_ops > 0 else 0
            
            # PnL por día (últimos 7 días)
            daily_pnl = []
            for i in range(7):
                day = datetime.utcnow() - timedelta(days=i)
                day_ops = [op for op in operations if op.created_at.date() == day.date()]
                day_pnl_value = sum(op.pnl for op in day_ops)
                daily_pnl.append({
                    "date": day.strftime("%Y-%m-%d"),
                    "pnl": round(day_pnl_value, 2)
                })
            
            daily_pnl.reverse()
            
            bot_performance.append({
                "bot_id": bot.id,
                "name": bot.name,
                "symbol": bot.symbol,
                "strategy": bot.strategy,
                "status": bot.status,
                "stake": float(bot.stake or 0),
                "current_balance": round(float(bot.stake or 0) + total_pnl, 2),
                "total_pnl": round(total_pnl, 2),
                "pnl_percentage": round((total_pnl / float(bot.stake or 1)) * 100, 2),
                "total_operations": total_ops,
                "win_rate": round(win_rate, 1),
                "daily_pnl": daily_pnl,
                "last_operation": operations[-1].created_at.isoformat() if operations else None
            })
        
        return {
            "success": True,
            "bots": bot_performance,
            "period_days": days
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching bots performance: {str(e)}")

@router.get("/api/dashboard/symbols-analysis")
async def get_symbols_analysis(
    days: int = Query(7, ge=1, le=90),
    authorization: str = Header(None)
):
    """
    📊 Análisis por par de moneda para gráficos específicos
    """
    try:
        # Lazy imports
        from db.database import get_session
        from services.auth_service import get_current_user_safe
        from routes.trading_operations import TradingOperation
        from sqlmodel import select
        
        # DL-003 COMPLIANT: Authentication via dependency function
        current_user = await get_current_user_safe(authorization)
        session = get_session()
        
        # Obtener operaciones por símbolo
        operations_query = select(TradingOperation).where(
            TradingOperation.user_id == current_user.id,
            TradingOperation.created_at >= datetime.utcnow() - timedelta(days=days)
        )
        operations = session.exec(operations_query).all()
        
        # Agrupar por símbolo
        symbols_data = defaultdict(lambda: {
            'operations': [],
            'total_pnl': 0,
            'total_operations': 0,
            'profitable_operations': 0,
            'daily_pnl': defaultdict(float)
        })
        
        for op in operations:
            symbol = op.symbol
            symbols_data[symbol]['operations'].append(op)
            symbols_data[symbol]['total_pnl'] += op.pnl
            symbols_data[symbol]['total_operations'] += 1
            if op.pnl > 0:
                symbols_data[symbol]['profitable_operations'] += 1
            
            # PnL diario
            date_key = op.created_at.date().isoformat()
            symbols_data[symbol]['daily_pnl'][date_key] += op.pnl
        
        # Formatear respuesta
        symbols_analysis = []
        for symbol, data in symbols_data.items():
            win_rate = (data['profitable_operations'] / data['total_operations'] * 100) if data['total_operations'] > 0 else 0
            
            # Convertir daily_pnl a lista ordenada
            daily_pnl_list = []
            for i in range(days):
                date = (datetime.utcnow() - timedelta(days=days-1-i)).date().isoformat()
                daily_pnl_list.append({
                    "date": date,
                    "pnl": round(data['daily_pnl'].get(date, 0), 2)
                })
            
            symbols_analysis.append({
                "symbol": symbol,
                "total_pnl": round(data['total_pnl'], 2),
                "total_operations": data['total_operations'],
                "win_rate": round(win_rate, 1),
                "avg_pnl_per_trade": round(data['total_pnl'] / data['total_operations'], 2) if data['total_operations'] > 0 else 0,
                "daily_pnl": daily_pnl_list,
                "performance_score": round(win_rate * (data['total_pnl'] / 100), 1)  # Score combinado
            })
        
        # Ordenar por performance
        symbols_analysis.sort(key=lambda x: x['performance_score'], reverse=True)
        
        return {
            "success": True,
            "symbols": symbols_analysis,
            "period_days": days,
            "total_symbols": len(symbols_analysis)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching symbols analysis: {str(e)}")