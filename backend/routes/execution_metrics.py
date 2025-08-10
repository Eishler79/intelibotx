#!/usr/bin/env python3
"""
🎯 API Endpoints para ExecutionMetrics - Métricas reales de ejecución
Endpoints para acceder a slippage, comisiones y latencias

Eduard Guzmán - InteliBotX
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging

# Importar el tracker de métricas
from services.execution_metrics import ExecutionMetricsTracker

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear router
router = APIRouter()

# Instanciar tracker global
metrics_tracker = ExecutionMetricsTracker()

@router.get("/api/bots/{bot_id}/execution-summary")
async def get_bot_execution_summary(
    bot_id: int,
    timeframe_hours: int = Query(24, description="Ventana de tiempo en horas", ge=1, le=168)
):
    """
    Obtener resumen de métricas de ejecución para un bot
    
    **Parámetros:**
    - bot_id: ID del bot
    - timeframe_hours: Ventana de tiempo (1-168 horas, default: 24h)
    
    **Retorna:**
    - Métricas de latencia, slippage, comisiones y eficiencia
    """
    try:
        logger.info(f"📊 Obteniendo resumen de ejecución para bot {bot_id} - {timeframe_hours}h")
        
        summary = await metrics_tracker.get_bot_execution_summary(bot_id, timeframe_hours)
        
        if 'error' in summary:
            raise HTTPException(status_code=500, detail=summary['error'])
        
        # Agregar metadata adicional
        summary['timestamp'] = datetime.utcnow().isoformat()
        summary['api_version'] = "v1.0"
        
        return JSONResponse(content={
            "success": True,
            "data": summary
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo resumen ejecución bot {bot_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo métricas: {str(e)}")

@router.get("/api/bots/{bot_id}/execution-metrics")
async def get_bot_execution_metrics(
    bot_id: int,
    limit: int = Query(50, description="Número máximo de ejecuciones", ge=1, le=200),
    strategy: Optional[str] = Query(None, description="Filtrar por estrategia"),
    symbol: Optional[str] = Query(None, description="Filtrar por símbolo")
):
    """
    Obtener métricas detalladas de ejecuciones recientes para un bot
    
    **Parámetros:**
    - bot_id: ID del bot
    - limit: Número máximo de registros (1-200, default: 50)
    - strategy: Filtrar por estrategia (opcional)
    - symbol: Filtrar por símbolo (opcional)
    
    **Retorna:**
    - Lista detallada de ejecuciones con todas las métricas
    """
    try:
        logger.info(f"📋 Obteniendo métricas detalladas para bot {bot_id}, limit={limit}")
        
        # Obtener ejecuciones recientes
        executions = await metrics_tracker.get_recent_executions(bot_id, limit)
        
        # Aplicar filtros si se especifican
        if strategy:
            executions = [e for e in executions if e['strategy'].lower() == strategy.lower()]
        
        if symbol:
            executions = [e for e in executions if e['symbol'].upper() == symbol.upper()]
        
        # Calcular estadísticas rápidas
        if executions:
            avg_latency = sum(e['latency_ms'] for e in executions) / len(executions)
            avg_slippage = sum(e['slippage_pct'] for e in executions) / len(executions)
            total_slippage_cost = sum(e['slippage_cost'] for e in executions)
            total_commission_cost = sum(e['commission_cost'] for e in executions)
            success_rate = sum(1 for e in executions if e['success']) / len(executions) * 100
        else:
            avg_latency = avg_slippage = total_slippage_cost = total_commission_cost = success_rate = 0
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "bot_id": bot_id,
                "total_records": len(executions),
                "filters_applied": {
                    "strategy": strategy,
                    "symbol": symbol,
                    "limit": limit
                },
                "quick_stats": {
                    "avg_latency_ms": round(avg_latency, 2),
                    "avg_slippage_pct": round(avg_slippage, 6),
                    "total_slippage_cost": round(total_slippage_cost, 4),
                    "total_commission_cost": round(total_commission_cost, 4),
                    "success_rate": round(success_rate, 2)
                },
                "executions": executions,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo métricas detalladas bot {bot_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo métricas: {str(e)}")

@router.get("/api/execution-metrics/system-stats")
async def get_system_execution_stats(
    timeframe_hours: int = Query(24, description="Ventana de tiempo en horas", ge=1, le=168)
):
    """
    Obtener estadísticas globales del sistema de ejecución
    
    **Parámetros:**
    - timeframe_hours: Ventana de tiempo (1-168 horas, default: 24h)
    
    **Retorna:**
    - Estadísticas agregadas de todos los bots del sistema
    """
    try:
        import sqlite3
        
        logger.info(f"🌍 Obteniendo estadísticas globales del sistema - {timeframe_hours}h")
        
        conn = sqlite3.connect(metrics_tracker.db_path)
        cursor = conn.cursor()
        
        # Calcular timestamp límite
        limit_time = datetime.utcnow() - timedelta(hours=timeframe_hours)
        
        # Estadísticas globales
        cursor.execute('''
            SELECT 
                COUNT(*) as total_executions,
                COUNT(DISTINCT bot_id) as active_bots,
                COUNT(DISTINCT symbol) as symbols_traded,
                AVG(total_latency_ms) as avg_latency,
                MAX(total_latency_ms) as max_latency,
                MIN(total_latency_ms) as min_latency,
                SUM(slippage_cost_usd) as total_slippage_cost,
                SUM(commission_paid) as total_commission_cost,
                AVG(efficiency_percentage) as avg_efficiency,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_executions,
                SUM(CASE WHEN latency_status IN ('EXCELLENT', 'OPTIMAL') THEN 1 ELSE 0 END) as fast_executions,
                SUM(CASE WHEN market_impact IN ('MINIMAL', 'LOW') THEN 1 ELSE 0 END) as low_impact_executions
            FROM execution_metrics
            WHERE timestamp > ?
        ''', (limit_time.isoformat(),))
        
        result = cursor.fetchone()
        
        # Top estrategias por eficiencia
        cursor.execute('''
            SELECT 
                strategy,
                COUNT(*) as executions,
                AVG(efficiency_percentage) as avg_efficiency,
                AVG(total_latency_ms) as avg_latency,
                SUM(slippage_cost_usd + commission_paid) as total_costs
            FROM execution_metrics
            WHERE timestamp > ? AND success = 1
            GROUP BY strategy
            ORDER BY avg_efficiency DESC
            LIMIT 5
        ''', (limit_time.isoformat(),))
        
        top_strategies = cursor.fetchall()
        
        # Top símbolos por volumen
        cursor.execute('''
            SELECT 
                symbol,
                COUNT(*) as executions,
                AVG(total_latency_ms) as avg_latency,
                AVG(slippage_percentage) as avg_slippage
            FROM execution_metrics
            WHERE timestamp > ? AND success = 1
            GROUP BY symbol
            ORDER BY executions DESC
            LIMIT 10
        ''', (limit_time.isoformat(),))
        
        top_symbols = cursor.fetchall()
        
        conn.close()
        
        if not result or result[0] == 0:
            return JSONResponse(content={
                "success": True,
                "data": {
                    "message": f"No hay datos de ejecución en las últimas {timeframe_hours}h",
                    "timeframe_hours": timeframe_hours,
                    "timestamp": datetime.utcnow().isoformat()
                }
            })
        
        total_executions = result[0]
        success_rate = (result[9] / total_executions * 100) if total_executions > 0 else 0
        fast_execution_rate = (result[10] / total_executions * 100) if total_executions > 0 else 0
        low_impact_rate = (result[11] / total_executions * 100) if total_executions > 0 else 0
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "timeframe_hours": timeframe_hours,
                "system_overview": {
                    "total_executions": total_executions,
                    "active_bots": result[1],
                    "symbols_traded": result[2],
                    "success_rate": round(success_rate, 2)
                },
                "performance_metrics": {
                    "avg_latency_ms": round(result[3] or 0, 2),
                    "min_latency_ms": round(result[5] or 0, 2),
                    "max_latency_ms": round(result[4] or 0, 2),
                    "fast_execution_rate": round(fast_execution_rate, 2),
                    "avg_system_efficiency": round(result[8] or 0, 2)
                },
                "cost_metrics": {
                    "total_slippage_cost": round(result[6] or 0, 4),
                    "total_commission_cost": round(result[7] or 0, 4),
                    "total_execution_cost": round((result[6] or 0) + (result[7] or 0), 4),
                    "low_slippage_rate": round(low_impact_rate, 2)
                },
                "top_strategies": [
                    {
                        "strategy": row[0],
                        "executions": row[1],
                        "avg_efficiency": round(row[2], 2),
                        "avg_latency_ms": round(row[3], 2),
                        "total_costs": round(row[4], 4)
                    } for row in top_strategies
                ],
                "top_symbols": [
                    {
                        "symbol": row[0],
                        "executions": row[1],
                        "avg_latency_ms": round(row[2], 2),
                        "avg_slippage_pct": round(row[3], 6)
                    } for row in top_symbols
                ],
                "timestamp": datetime.utcnow().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo estadísticas del sistema: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")

@router.post("/api/bots/{bot_id}/simulate-execution")
async def simulate_bot_execution(
    bot_id: int,
    symbol: str,
    side: str,
    quantity: float,
    expected_price: float,
    strategy: str = "Smart Scalper",
    market_type: str = "spot",
    vip_level: int = 0,
    use_bnb_discount: bool = False
):
    """
    Simular una ejecución de orden con métricas completas
    
    **Útil para:**
    - Testing de estrategias
    - Análisis de costos esperados
    - Validación de parámetros
    
    **Parámetros:**
    - bot_id: ID del bot
    - symbol: Par de trading (ej: BTCUSDT)
    - side: BUY/SELL
    - quantity: Cantidad a tradear
    - expected_price: Precio esperado
    - strategy: Estrategia (default: Smart Scalper)
    - market_type: spot/futures (default: spot)
    - vip_level: Nivel VIP Binance (0-3)
    - use_bnb_discount: Usar descuento BNB (default: false)
    """
    try:
        logger.info(f"🧪 Simulando ejecución para bot {bot_id}: {side} {quantity} {symbol} @ {expected_price}")
        
        # Validar parámetros
        if side not in ['BUY', 'SELL']:
            raise HTTPException(status_code=400, detail="side debe ser 'BUY' o 'SELL'")
        
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="quantity debe ser mayor a 0")
        
        if expected_price <= 0:
            raise HTTPException(status_code=400, detail="expected_price debe ser mayor a 0")
        
        if market_type not in ['spot', 'futures']:
            raise HTTPException(status_code=400, detail="market_type debe ser 'spot' o 'futures'")
        
        if vip_level not in [0, 1, 2, 3]:
            raise HTTPException(status_code=400, detail="vip_level debe estar entre 0 y 3")
        
        # Ejecutar simulación con métricas
        execution_metrics = await metrics_tracker.execute_order_with_metrics(
            bot_id=bot_id,
            symbol=symbol.upper(),
            side=side.upper(),
            quantity=quantity,
            expected_price=expected_price,
            strategy=strategy,
            market_type=market_type,
            vip_level=vip_level,
            use_bnb_discount=use_bnb_discount
        )
        
        # Formatear respuesta
        response_data = {
            "execution_id": execution_metrics.execution_id,
            "success": execution_metrics.success,
            "timestamp": execution_metrics.timestamp,
            "trade_details": {
                "symbol": execution_metrics.symbol,
                "side": execution_metrics.side,
                "strategy": execution_metrics.strategy,
                "expected_price": execution_metrics.expected_price,
                "executed_price": execution_metrics.executed_price,
                "quantity": execution_metrics.quantity,
                "trade_value_usd": round(execution_metrics.executed_price * execution_metrics.quantity, 2)
            },
            "performance_metrics": {
                "latency": {
                    "total_ms": round(execution_metrics.latency.total_execution_time, 2),
                    "api_ms": round(execution_metrics.latency.api_to_exchange, 2),
                    "status": execution_metrics.latency.status
                },
                "slippage": {
                    "points": round(execution_metrics.slippage.slippage_points, 8),
                    "percentage": round(execution_metrics.slippage.slippage_percentage, 6),
                    "cost_usd": round(execution_metrics.slippage.slippage_cost_usd, 4),
                    "impact": execution_metrics.slippage.market_impact
                },
                "commission": {
                    "rate": execution_metrics.commission.effective_rate,
                    "cost_usd": round(execution_metrics.commission.commission_paid, 4),
                    "bnb_discount": execution_metrics.commission.bnb_discount,
                    "vip_level": execution_metrics.commission.vip_level
                }
            },
            "cost_analysis": {
                "gross_profit_loss": round((execution_metrics.executed_price - expected_price) * quantity, 4),
                "slippage_cost": round(execution_metrics.slippage.slippage_cost_usd, 4),
                "commission_cost": round(execution_metrics.commission.commission_paid, 4),
                "net_execution_cost": round(execution_metrics.slippage.slippage_cost_usd + execution_metrics.commission.commission_paid, 4),
                "efficiency_score": round(max(0, 100 - ((execution_metrics.slippage.slippage_cost_usd + execution_metrics.commission.commission_paid) / (execution_metrics.executed_price * execution_metrics.quantity) * 100)), 2)
            }
        }
        
        if execution_metrics.error_msg:
            response_data["error_details"] = execution_metrics.error_msg
        
        return JSONResponse(content={
            "success": True,
            "data": response_data
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error simulando ejecución: {e}")
        raise HTTPException(status_code=500, detail=f"Error en simulación: {str(e)}")

# 🏥 Health check endpoint
@router.get("/api/execution-metrics/health")
async def health_check():
    """Health check para el sistema de métricas de ejecución"""
    try:
        # Verificar base de datos
        import sqlite3
        import os
        
        db_exists = os.path.exists(metrics_tracker.db_path)
        
        if db_exists:
            conn = sqlite3.connect(metrics_tracker.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM execution_metrics")
            total_records = cursor.fetchone()[0]
            conn.close()
        else:
            total_records = 0
        
        return JSONResponse(content={
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "exists": db_exists,
                "total_records": total_records,
                "path": metrics_tracker.db_path
            },
            "commission_rates": metrics_tracker.commission_rates,
            "version": "v1.0"
        })
        
    except Exception as e:
        logger.error(f"❌ Error en health check: {e}")
        raise HTTPException(status_code=500, detail=f"Sistema no saludable: {str(e)}")