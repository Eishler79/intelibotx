#!/usr/bin/env python3
"""
🎯 ExecutionMetricsTracker - Sistema de métricas reales de ejecución
Tracking de: Slippage, Comisiones, Latencias para trading real

Eduard Guzmán - InteliBotX
"""

import time
import asyncio
import httpx
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import json
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class LatencyMetrics:
    """Métricas de latencia de ejecución"""
    signal_to_api: float        # ms desde señal hasta API call
    api_to_exchange: float      # ms desde API hasta exchange
    exchange_processing: float  # ms procesamiento en exchange
    confirmation_back: float    # ms desde ejecución hasta confirmación
    total_execution_time: float # ms total
    status: str                 # OPTIMAL/SLOW/CRITICAL

@dataclass
class SlippageMetrics:
    """Métricas de slippage de precios"""
    expected_price: float
    executed_price: float
    slippage_points: float
    slippage_percentage: float
    slippage_cost_usd: float
    market_impact: str          # MINIMAL/LOW/MEDIUM/HIGH

@dataclass
class CommissionMetrics:
    """Métricas de comisiones reales"""
    base_commission_rate: float
    executed_volume: float
    commission_paid: float
    bnb_discount: bool
    effective_rate: float
    vip_level: int

@dataclass
class ExecutionMetrics:
    """Métricas completas de ejecución de orden"""
    timestamp: str
    bot_id: int
    symbol: str
    side: str
    strategy: str
    expected_price: float
    executed_price: float
    quantity: float
    latency: LatencyMetrics
    slippage: SlippageMetrics
    commission: CommissionMetrics
    execution_id: str
    success: bool
    error_msg: Optional[str] = None

class ExecutionMetricsTracker:
    """Sistema principal de tracking de métricas de ejecución"""
    
    def __init__(self, db_path: str = "execution_metrics.db"):
        self.db_path = db_path
        self.commission_rates = {
            'spot': {
                'maker': 0.001,    # 0.1%
                'taker': 0.001     # 0.1%
            },
            'futures': {
                'maker': 0.0002,   # 0.02%
                'taker': 0.0004    # 0.04%
            }
        }
        
        # VIP Level discounts (Binance)
        self.vip_discounts = {
            0: 1.0,      # No discount
            1: 0.9,      # 10% discount
            2: 0.8,      # 20% discount
            3: 0.7,      # 30% discount
        }
        
        # BNB discount (25%)
        self.bnb_discount = 0.75
        
        self._init_database()
        
    def _init_database(self):
        """Inicializar base de datos para métricas"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Tabla principal de métricas de ejecución
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS execution_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    bot_id INTEGER NOT NULL,
                    symbol TEXT NOT NULL,
                    side TEXT NOT NULL,
                    strategy TEXT NOT NULL,
                    expected_price REAL NOT NULL,
                    executed_price REAL NOT NULL,
                    quantity REAL NOT NULL,
                    
                    -- Latency metrics
                    total_latency_ms REAL NOT NULL,
                    api_latency_ms REAL NOT NULL,
                    latency_status TEXT NOT NULL,
                    
                    -- Slippage metrics
                    slippage_points REAL NOT NULL,
                    slippage_percentage REAL NOT NULL,
                    slippage_cost_usd REAL NOT NULL,
                    market_impact TEXT NOT NULL,
                    
                    -- Commission metrics
                    commission_rate REAL NOT NULL,
                    commission_paid REAL NOT NULL,
                    trade_value REAL NOT NULL,
                    bnb_discount INTEGER DEFAULT 0,
                    vip_level INTEGER DEFAULT 0,
                    
                    -- Execution details
                    execution_id TEXT NOT NULL,
                    success INTEGER NOT NULL,
                    error_msg TEXT,
                    
                    -- Calculated metrics
                    net_execution_cost REAL NOT NULL,
                    efficiency_percentage REAL NOT NULL,
                    
                    UNIQUE(execution_id)
                )
            ''')
            
            # Índices para optimizar consultas
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_bot_timestamp ON execution_metrics(bot_id, timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_symbol_timestamp ON execution_metrics(symbol, timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_strategy ON execution_metrics(strategy)')
            
            conn.commit()
            conn.close()
            logger.info("✅ Base de datos de métricas inicializada correctamente")
            
        except Exception as e:
            logger.error(f"❌ Error inicializando base de datos: {e}")
            raise

    async def execute_order_with_metrics(
        self, 
        bot_id: int,
        symbol: str, 
        side: str,
        quantity: float, 
        expected_price: float,
        strategy: str,
        market_type: str = 'spot',
        vip_level: int = 0,
        use_bnb_discount: bool = False
    ) -> ExecutionMetrics:
        """
        Ejecutar orden con tracking completo de métricas
        
        Args:
            bot_id: ID del bot que ejecuta la orden
            symbol: Par de trading (ej: BTCUSDT)
            side: BUY/SELL
            quantity: Cantidad a tradear
            expected_price: Precio esperado de la señal
            strategy: Estrategia que genera la señal
            market_type: spot/futures
            vip_level: Nivel VIP Binance
            use_bnb_discount: Si usar descuento BNB
        """
        
        # 🕐 Iniciar tracking de tiempo
        execution_start = time.perf_counter()
        signal_timestamp = datetime.utcnow()
        execution_id = f"{bot_id}_{symbol}_{int(time.time() * 1000)}"
        
        logger.info(f"🚀 Iniciando ejecución con métricas - {execution_id}")
        
        try:
            # 📡 API Call con timing
            api_start = time.perf_counter()
            order_result = await self._simulate_binance_order(symbol, side, quantity, expected_price)
            api_end = time.perf_counter()
            
            # 📊 Calcular métricas de latencia
            api_latency = (api_end - api_start) * 1000
            total_latency = (time.perf_counter() - execution_start) * 1000
            
            latency_metrics = LatencyMetrics(
                signal_to_api=5.0,  # Simulado - en real sería medido
                api_to_exchange=api_latency * 0.7,  # ~70% del tiempo de API
                exchange_processing=api_latency * 0.2,  # ~20% procesamiento
                confirmation_back=api_latency * 0.1,  # ~10% confirmación
                total_execution_time=total_latency,
                status=self._classify_latency(total_latency)
            )
            
            # 💰 Calcular métricas de slippage
            executed_price = order_result.get('executed_price', expected_price)
            slippage_points = abs(executed_price - expected_price)
            slippage_percentage = (slippage_points / expected_price) * 100
            slippage_cost = slippage_points * quantity
            
            slippage_metrics = SlippageMetrics(
                expected_price=expected_price,
                executed_price=executed_price,
                slippage_points=slippage_points,
                slippage_percentage=slippage_percentage,
                slippage_cost_usd=slippage_cost,
                market_impact=self._classify_market_impact(slippage_percentage)
            )
            
            # 🏦 Calcular métricas de comisiones
            trade_value = executed_price * quantity
            base_rate = self.commission_rates[market_type]['taker']  # Asumimos taker
            
            # Aplicar descuentos
            effective_rate = base_rate
            if vip_level > 0:
                effective_rate *= self.vip_discounts.get(vip_level, 1.0)
            if use_bnb_discount:
                effective_rate *= self.bnb_discount
                
            commission_paid = trade_value * effective_rate
            
            commission_metrics = CommissionMetrics(
                base_commission_rate=base_rate,
                executed_volume=trade_value,
                commission_paid=commission_paid,
                bnb_discount=use_bnb_discount,
                effective_rate=effective_rate,
                vip_level=vip_level
            )
            
            # 📈 Crear métricas completas
            execution_metrics = ExecutionMetrics(
                timestamp=signal_timestamp.isoformat(),
                bot_id=bot_id,
                symbol=symbol,
                side=side,
                strategy=strategy,
                expected_price=expected_price,
                executed_price=executed_price,
                quantity=quantity,
                latency=latency_metrics,
                slippage=slippage_metrics,
                commission=commission_metrics,
                execution_id=execution_id,
                success=True
            )
            
            # 💾 Guardar en base de datos
            await self._save_execution_metrics(execution_metrics)
            
            logger.info(f"✅ Ejecución completada - Latency: {total_latency:.2f}ms, Slippage: {slippage_percentage:.4f}%, Commission: ${commission_paid:.4f}")
            
            return execution_metrics
            
        except Exception as e:
            # 🚨 Error en ejecución
            error_latency = (time.perf_counter() - execution_start) * 1000
            
            error_metrics = ExecutionMetrics(
                timestamp=signal_timestamp.isoformat(),
                bot_id=bot_id,
                symbol=symbol,
                side=side,
                strategy=strategy,
                expected_price=expected_price,
                executed_price=expected_price,  # No ejecutado
                quantity=quantity,
                latency=LatencyMetrics(0, 0, 0, 0, error_latency, "ERROR"),
                slippage=SlippageMetrics(expected_price, expected_price, 0, 0, 0, "N/A"),
                commission=CommissionMetrics(0, 0, 0, False, 0, 0),
                execution_id=execution_id,
                success=False,
                error_msg=str(e)
            )
            
            await self._save_execution_metrics(error_metrics)
            logger.error(f"❌ Error en ejecución: {e}")
            return error_metrics

    async def _simulate_binance_order(self, symbol: str, side: str, quantity: float, expected_price: float) -> Dict[str, Any]:
        """
        Simular orden Binance con características realistas
        En producción, esto sería reemplazado por llamadas reales a Binance API
        """
        
        # Simular latencia de red (30-80ms típico)
        await asyncio.sleep(0.05)  # 50ms
        
        # Simular slippage realista basado en volatilidad del mercado
        volatility_factor = 0.0005  # 0.05% volatilidad base
        market_noise = (time.time() % 1) * 2 - 1  # -1 a +1
        
        slippage_factor = volatility_factor * market_noise
        executed_price = expected_price * (1 + slippage_factor)
        
        # Si es orden de compra, precio tiende a ser ligeramente mayor
        if side == "BUY":
            executed_price *= 1.0002  # +0.02% slippage típico en compras
        else:
            executed_price *= 0.9998  # -0.02% slippage típico en ventas
            
        return {
            'symbol': symbol,
            'side': side,
            'quantity': quantity,
            'executed_price': round(executed_price, 8),
            'status': 'FILLED',
            'order_id': f"binance_{int(time.time() * 1000)}",
            'timestamp': datetime.utcnow().isoformat()
        }

    def _classify_latency(self, latency_ms: float) -> str:
        """Clasificar latencia de ejecución"""
        if latency_ms < 50:
            return "EXCELLENT"
        elif latency_ms < 100:
            return "OPTIMAL"
        elif latency_ms < 200:
            return "ACCEPTABLE"
        elif latency_ms < 500:
            return "SLOW"
        else:
            return "CRITICAL"

    def _classify_market_impact(self, slippage_pct: float) -> str:
        """Clasificar impacto de mercado basado en slippage"""
        if slippage_pct < 0.001:    # < 0.001%
            return "MINIMAL"
        elif slippage_pct < 0.01:   # < 0.01%
            return "LOW" 
        elif slippage_pct < 0.05:   # < 0.05%
            return "MEDIUM"
        elif slippage_pct < 0.1:    # < 0.1%
            return "HIGH"
        else:
            return "EXTREME"

    async def _save_execution_metrics(self, metrics: ExecutionMetrics):
        """Guardar métricas en base de datos"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Calcular métricas derivadas
            net_execution_cost = metrics.slippage.slippage_cost_usd + metrics.commission.commission_paid
            efficiency = max(0, 100 - (net_execution_cost / (metrics.executed_price * metrics.quantity) * 100))
            
            cursor.execute('''
                INSERT OR REPLACE INTO execution_metrics (
                    timestamp, bot_id, symbol, side, strategy,
                    expected_price, executed_price, quantity,
                    total_latency_ms, api_latency_ms, latency_status,
                    slippage_points, slippage_percentage, slippage_cost_usd, market_impact,
                    commission_rate, commission_paid, trade_value, bnb_discount, vip_level,
                    execution_id, success, error_msg,
                    net_execution_cost, efficiency_percentage
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                metrics.timestamp, metrics.bot_id, metrics.symbol, metrics.side, metrics.strategy,
                metrics.expected_price, metrics.executed_price, metrics.quantity,
                metrics.latency.total_execution_time, 
                metrics.latency.api_to_exchange, 
                metrics.latency.status,
                metrics.slippage.slippage_points, 
                metrics.slippage.slippage_percentage, 
                metrics.slippage.slippage_cost_usd, 
                metrics.slippage.market_impact,
                metrics.commission.effective_rate, 
                metrics.commission.commission_paid, 
                metrics.commission.executed_volume,
                1 if metrics.commission.bnb_discount else 0,
                metrics.commission.vip_level,
                metrics.execution_id, 
                1 if metrics.success else 0, 
                metrics.error_msg,
                net_execution_cost, 
                efficiency
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ Error guardando métricas: {e}")
            raise

    async def get_bot_execution_summary(self, bot_id: int, timeframe_hours: int = 24) -> Dict[str, Any]:
        """
        Obtener resumen de métricas de ejecución para un bot
        
        Args:
            bot_id: ID del bot
            timeframe_hours: Ventana de tiempo en horas (default: 24h)
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Calcular timestamp límite
            limit_time = datetime.utcnow() - timedelta(hours=timeframe_hours)
            
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_executions,
                    AVG(total_latency_ms) as avg_latency,
                    MAX(total_latency_ms) as max_latency,
                    SUM(slippage_cost_usd) as total_slippage_cost,
                    SUM(commission_paid) as total_commission_cost,
                    AVG(slippage_percentage) as avg_slippage_pct,
                    AVG(efficiency_percentage) as avg_efficiency,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_executions,
                    SUM(CASE WHEN latency_status IN ('EXCELLENT', 'OPTIMAL') THEN 1 ELSE 0 END) as fast_executions,
                    SUM(CASE WHEN market_impact IN ('MINIMAL', 'LOW') THEN 1 ELSE 0 END) as low_impact_executions
                FROM execution_metrics
                WHERE bot_id = ? AND timestamp > ?
            ''', (bot_id, limit_time.isoformat()))
            
            result = cursor.fetchone()
            conn.close()
            
            if not result or result[0] == 0:
                return {
                    'total_executions': 0,
                    'message': f'No hay datos de ejecución para el bot {bot_id} en las últimas {timeframe_hours}h'
                }
            
            total_executions = result[0]
            
            return {
                'bot_id': bot_id,
                'timeframe_hours': timeframe_hours,
                'total_executions': total_executions,
                'execution_metrics': {
                    'avg_latency_ms': round(result[1] or 0, 2),
                    'max_latency_ms': round(result[2] or 0, 2),
                    'fast_execution_rate': round((result[8] or 0) / total_executions * 100, 2),
                    'success_rate': round((result[7] or 0) / total_executions * 100, 2)
                },
                'cost_metrics': {
                    'total_slippage_cost': round(result[3] or 0, 4),
                    'total_commission_cost': round(result[4] or 0, 4),
                    'total_execution_cost': round((result[3] or 0) + (result[4] or 0), 4),
                    'avg_slippage_percentage': round(result[5] or 0, 6),
                    'avg_efficiency': round(result[6] or 0, 2)
                },
                'quality_metrics': {
                    'low_slippage_rate': round((result[9] or 0) / total_executions * 100, 2),
                    'execution_quality_score': round((result[6] or 0), 2)  # Based on efficiency
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo resumen: {e}")
            return {'error': str(e)}

    async def get_recent_executions(self, bot_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Obtener ejecuciones recientes para un bot"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 
                    timestamp, symbol, side, strategy,
                    expected_price, executed_price, quantity,
                    total_latency_ms, slippage_percentage, slippage_cost_usd,
                    commission_paid, efficiency_percentage, success, market_impact, latency_status
                FROM execution_metrics
                WHERE bot_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (bot_id, limit))
            
            rows = cursor.fetchall()
            conn.close()
            
            executions = []
            for row in rows:
                executions.append({
                    'timestamp': row[0],
                    'symbol': row[1],
                    'side': row[2],
                    'strategy': row[3],
                    'expected_price': row[4],
                    'executed_price': row[5],
                    'quantity': row[6],
                    'latency_ms': row[7],
                    'slippage_pct': row[8],
                    'slippage_cost': row[9],
                    'commission_cost': row[10],
                    'efficiency': row[11],
                    'success': bool(row[12]),
                    'market_impact': row[13],
                    'latency_status': row[14]
                })
            
            return executions
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo ejecuciones recientes: {e}")
            return []

# 🧪 Función de testing
async def test_execution_metrics():
    """Test del sistema de métricas"""
    tracker = ExecutionMetricsTracker()
    
    print("🧪 Testing ExecutionMetricsTracker...")
    
    # Simular algunas ejecuciones
    for i in range(5):
        metrics = await tracker.execute_order_with_metrics(
            bot_id=1,
            symbol="BTCUSDT",
            side="BUY" if i % 2 == 0 else "SELL",
            quantity=0.001,
            expected_price=65000 + (i * 10),
            strategy="Smart Scalper",
            market_type="spot",
            vip_level=0,
            use_bnb_discount=True
        )
        
        print(f"Trade {i+1}: Latency={metrics.latency.total_execution_time:.2f}ms, "
              f"Slippage={metrics.slippage.slippage_percentage:.4f}%, "
              f"Commission=${metrics.commission.commission_paid:.4f}")
        
        await asyncio.sleep(0.1)  # Pequeña pausa entre trades
    
    # Obtener resumen
    summary = await tracker.get_bot_execution_summary(bot_id=1)
    print(f"\n📊 Resumen Bot 1:")
    print(f"Total ejecuciones: {summary['total_executions']}")
    print(f"Latencia promedio: {summary['execution_metrics']['avg_latency_ms']:.2f}ms")
    print(f"Costo total ejecución: ${summary['cost_metrics']['total_execution_cost']:.4f}")
    print(f"Eficiencia promedio: {summary['cost_metrics']['avg_efficiency']:.2f}%")

if __name__ == "__main__":
    asyncio.run(test_execution_metrics())