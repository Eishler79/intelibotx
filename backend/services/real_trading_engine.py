#!/usr/bin/env python3
"""
🎯 RealTradingEngine - Motor de ejecución de órdenes reales en Binance
Sistema completo para ejecutar trades reales con gestión de riesgo

Eduard Guzmán - InteliBotX
"""

import asyncio
import httpx
import hmac
import hashlib
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import logging
import json
from urllib.parse import urlencode

from services.execution_metrics import ExecutionMetricsTracker
from services.technical_analysis_service import TechnicalAnalysisService

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TradeOrder:
    """Estructura de orden de trading"""
    symbol: str
    side: str  # BUY/SELL
    type: str  # MARKET/LIMIT
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    time_in_force: str = "GTC"
    order_id: Optional[str] = None
    client_order_id: Optional[str] = None

@dataclass
class TradeResult:
    """Resultado de ejecución de trade"""
    success: bool
    order_id: Optional[str]
    symbol: str
    side: str
    quantity: float
    executed_price: float
    executed_qty: float
    status: str
    timestamp: str
    execution_metrics: Optional[Dict] = None
    error_message: Optional[str] = None

class RealTradingEngine:
    """Motor principal de trading real con Binance"""
    
    def __init__(
        self, 
        api_key: str, 
        api_secret: str, 
        use_testnet: bool = True,
        enable_real_trading: bool = False
    ):
        self.api_key = api_key
        self.api_secret = api_secret
        self.use_testnet = use_testnet
        self.enable_real_trading = enable_real_trading
        
        # URLs de Binance
        if use_testnet:
            self.base_url = "https://testnet.binance.vision/api/v3"
        else:
            self.base_url = "https://api.binance.com/api/v3"
            
        # Servicios auxiliares
        self.metrics_tracker = ExecutionMetricsTracker()
        self.technical_analysis = TechnicalAnalysisService(use_testnet=use_testnet)
        
        # Estado del motor
        self.active_orders = {}  # symbol -> order_info
        self.trading_enabled = False
        
        logger.info(f"🚀 RealTradingEngine inicializado ({'TESTNET' if use_testnet else 'MAINNET'}, trading={'ENABLED' if enable_real_trading else 'DISABLED'})")

    async def enable_trading(self) -> bool:
        """Habilitar trading después de validar credenciales"""
        try:
            # Validar credenciales con account info
            account_info = await self.get_account_info()
            if account_info and 'accountType' in account_info:
                self.trading_enabled = True
                logger.info("✅ Trading habilitado - Credenciales válidas")
                return True
            else:
                logger.error("❌ No se puede habilitar trading - Credenciales inválidas")
                return False
        except Exception as e:
            logger.error(f"❌ Error validando credenciales: {e}")
            return False

    def _generate_signature(self, query_string: str) -> str:
        """Generar firma HMAC-SHA256 para Binance"""
        return hmac.new(
            self.api_secret.encode('utf-8'), 
            query_string.encode('utf-8'), 
            hashlib.sha256
        ).hexdigest()

    def _get_headers(self) -> Dict[str, str]:
        """Headers para requests autenticados"""
        return {
            'X-MBX-APIKEY': self.api_key,
            'Content-Type': 'application/json'
        }

    async def get_account_info(self) -> Optional[Dict]:
        """Obtener información de la cuenta"""
        try:
            timestamp = int(time.time() * 1000)
            query_string = f"timestamp={timestamp}"
            signature = self._generate_signature(query_string)
            
            url = f"{self.base_url}/account?{query_string}&signature={signature}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self._get_headers(), timeout=10.0)
                
                if response.status_code == 200:
                    account_data = response.json()
                    logger.info(f"✅ Cuenta conectada: {account_data.get('accountType', 'UNKNOWN')}")
                    return account_data
                else:
                    logger.error(f"❌ Error obteniendo info cuenta: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error conectando cuenta: {e}")
            return None

    async def get_balance(self, asset: str = "USDT") -> float:
        """Obtener balance de un asset específico"""
        try:
            account_info = await self.get_account_info()
            if not account_info:
                return 0.0
                
            for balance in account_info.get('balances', []):
                if balance['asset'] == asset:
                    free_balance = float(balance['free'])
                    logger.info(f"💰 Balance {asset}: {free_balance}")
                    return free_balance
                    
            return 0.0
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo balance {asset}: {e}")
            return 0.0

    async def execute_market_order(
        self, 
        symbol: str, 
        side: str, 
        quantity: float,
        bot_id: int,
        strategy: str = "Manual"
    ) -> TradeResult:
        """
        Ejecutar orden de mercado real en Binance
        
        Args:
            symbol: Par de trading (ej: BTCUSDT)
            side: BUY o SELL
            quantity: Cantidad a tradear
            bot_id: ID del bot que ejecuta
            strategy: Estrategia que generó la señal
        """
        if not self.trading_enabled:
            logger.warning("⚠️ Trading no está habilitado")
            return self._create_error_result(symbol, side, quantity, "Trading disabled")
            
        if not self.enable_real_trading:
            logger.info("🧪 Modo simulación - ejecutando orden simulada")
            return await self._execute_simulated_order(symbol, side, quantity, bot_id, strategy)

        try:
            # Obtener precio actual para métricas
            current_price_data = await self.technical_analysis.binance_service.get_current_price(symbol)
            expected_price = current_price_data['price']
            
            logger.info(f"🚀 Ejecutando orden REAL {side} {quantity} {symbol} @ ~${expected_price:,.2f}")
            
            # Parámetros de la orden
            timestamp = int(time.time() * 1000)
            order_params = {
                'symbol': symbol.upper(),
                'side': side.upper(),
                'type': 'MARKET',
                'quantity': str(quantity),
                'timestamp': timestamp
            }
            
            # Crear query string y firma
            query_string = urlencode(order_params)
            signature = self._generate_signature(query_string)
            order_params['signature'] = signature
            
            # Ejecutar orden
            execution_start = time.perf_counter()
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/order",
                    data=order_params,
                    headers=self._get_headers(),
                    timeout=15.0
                )
                
                execution_time = (time.perf_counter() - execution_start) * 1000  # ms
                
                if response.status_code == 200:
                    order_result = response.json()
                    
                    # Extraer datos de la orden ejecutada
                    executed_qty = float(order_result.get('executedQty', quantity))
                    executed_price = 0.0
                    
                    # Calcular precio promedio de ejecución
                    if 'fills' in order_result:
                        total_value = sum(float(fill['price']) * float(fill['qty']) for fill in order_result['fills'])
                        total_qty = sum(float(fill['qty']) for fill in order_result['fills'])
                        executed_price = total_value / total_qty if total_qty > 0 else expected_price
                    else:
                        executed_price = expected_price
                    
                    # Registrar métricas de ejecución
                    execution_metrics = await self.metrics_tracker.execute_order_with_metrics(
                        bot_id=bot_id,
                        symbol=symbol,
                        side=side,
                        quantity=quantity,
                        expected_price=expected_price,
                        strategy=strategy,
                        market_type='spot',  # TODO: Detectar automáticamente
                        vip_level=0,
                        use_bnb_discount=False
                    )
                    
                    result = TradeResult(
                        success=True,
                        order_id=order_result.get('orderId'),
                        symbol=symbol,
                        side=side,
                        quantity=quantity,
                        executed_price=executed_price,
                        executed_qty=executed_qty,
                        status=order_result.get('status', 'FILLED'),
                        timestamp=datetime.utcnow().isoformat(),
                        execution_metrics=asdict(execution_metrics)
                    )
                    
                    logger.info(f"✅ Orden ejecutada: {side} {executed_qty} {symbol} @ ${executed_price:,.4f}")
                    return result
                    
                else:
                    error_msg = f"Error Binance: {response.status_code} - {response.text}"
                    logger.error(f"❌ {error_msg}")
                    return self._create_error_result(symbol, side, quantity, error_msg)
                    
        except Exception as e:
            error_msg = f"Error ejecutando orden: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return self._create_error_result(symbol, side, quantity, error_msg)

    async def _execute_simulated_order(
        self, 
        symbol: str, 
        side: str, 
        quantity: float,
        bot_id: int,
        strategy: str
    ) -> TradeResult:
        """Ejecutar orden simulada con métricas reales"""
        try:
            # Obtener precio real para simulación precisa
            current_price_data = await self.technical_analysis.binance_service.get_current_price(symbol)
            expected_price = current_price_data['price']
            
            # Simular ejecución con slippage realista
            slippage_factor = 0.0005 * (1 if side == 'BUY' else -1)  # 0.05% slippage
            executed_price = expected_price * (1 + slippage_factor)
            
            logger.info(f"🧪 Simulando orden {side} {quantity} {symbol} @ ${executed_price:,.4f}")
            
            # Registrar métricas reales (slippage y latencia simulados)
            execution_metrics = await self.metrics_tracker.execute_order_with_metrics(
                bot_id=bot_id,
                symbol=symbol,
                side=side,
                quantity=quantity,
                expected_price=expected_price,
                strategy=strategy
            )
            
            # Simular orden ID
            order_id = f"SIM_{int(time.time() * 1000)}"
            
            result = TradeResult(
                success=True,
                order_id=order_id,
                symbol=symbol,
                side=side,
                quantity=quantity,
                executed_price=executed_price,
                executed_qty=quantity,
                status="FILLED_SIMULATED",
                timestamp=datetime.utcnow().isoformat(),
                execution_metrics=asdict(execution_metrics)
            )
            
            logger.info(f"✅ Orden simulada ejecutada: {side} {quantity} {symbol}")
            return result
            
        except Exception as e:
            error_msg = f"Error en simulación: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return self._create_error_result(symbol, side, quantity, error_msg)

    async def execute_smart_scalper_trade(
        self, 
        symbol: str, 
        bot_id: int,
        stake: float = 1000.0,
        risk_percentage: float = 1.0
    ) -> Dict[str, Any]:
        """
        Ejecutar trade completo basado en análisis Smart Scalper
        
        Returns:
            Diccionario con análisis + resultado de ejecución
        """
        try:
            logger.info(f"🎯 Ejecutando Smart Scalper para {symbol} (${stake})")
            
            # 1. Obtener análisis Smart Scalper
            analysis = await self.technical_analysis.get_strategy_analysis(
                'Smart Scalper', 
                symbol, 
                '15m',
                stake=stake
            )
            
            # 2. Evaluar señal
            signal = analysis['signal']
            confidence = analysis['confidence']
            
            if signal == 'HOLD' or confidence < 0.65:
                logger.info(f"⏸️ No trading: {signal} (confianza: {confidence:.0%})")
                return {
                    'action': 'NO_TRADE',
                    'reason': f'{signal} - Confianza insuficiente ({confidence:.0%})',
                    'analysis': analysis
                }
            
            # 3. Calcular tamaño de posición
            account_balance = await self.get_balance("USDT")
            max_risk = account_balance * (risk_percentage / 100)
            
            # Calcular quantity basada en riesgo y stop loss
            current_price = analysis['entry_price']
            stop_loss_price = analysis['stop_loss']
            risk_per_unit = abs(current_price - stop_loss_price)
            
            if risk_per_unit > 0:
                max_quantity = max_risk / risk_per_unit
                # Usar el menor entre stake calculado y riesgo máximo
                quantity = min(stake / current_price, max_quantity)
            else:
                quantity = stake / current_price
                
            # Redondear quantity según las reglas de Binance
            quantity = round(quantity, 6)  # Binance típicamente permite 6 decimales
            
            if quantity <= 0:
                logger.warning(f"⚠️ Quantity calculado inválido: {quantity}")
                return {
                    'action': 'ERROR',
                    'reason': 'Quantity inválido',
                    'analysis': analysis
                }
            
            # 4. Ejecutar orden principal
            trade_side = 'BUY' if signal in ['BUY', 'WEAK_BUY'] else 'SELL'
            
            trade_result = await self.execute_market_order(
                symbol=symbol,
                side=trade_side,
                quantity=quantity,
                bot_id=bot_id,
                strategy='Smart Scalper'
            )
            
            # 5. Si la orden fue exitosa, colocar stop loss y take profit
            if trade_result.success:
                # TODO: Implementar órdenes OCO (One-Cancels-Other) para TP/SL automático
                # Por ahora solo registrar los niveles calculados
                pass
            
            return {
                'action': 'TRADE_EXECUTED' if trade_result.success else 'TRADE_FAILED',
                'signal': signal,
                'confidence': confidence,
                'analysis': analysis,
                'trade_result': asdict(trade_result),
                'position_details': {
                    'entry_price': current_price,
                    'take_profit': analysis['take_profit'],
                    'stop_loss': analysis['stop_loss'],
                    'risk_reward_ratio': analysis['risk_reward_ratio'],
                    'quantity': quantity,
                    'risk_amount': max_risk
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error ejecutando Smart Scalper trade: {e}")
            return {
                'action': 'ERROR',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }

    def _create_error_result(
        self, 
        symbol: str, 
        side: str, 
        quantity: float, 
        error_message: str
    ) -> TradeResult:
        """Crear resultado de error estandarizado"""
        return TradeResult(
            success=False,
            order_id=None,
            symbol=symbol,
            side=side,
            quantity=quantity,
            executed_price=0.0,
            executed_qty=0.0,
            status="ERROR",
            timestamp=datetime.utcnow().isoformat(),
            error_message=error_message
        )

    async def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict]:
        """Obtener órdenes abiertas"""
        try:
            timestamp = int(time.time() * 1000)
            params = {'timestamp': timestamp}
            
            if symbol:
                params['symbol'] = symbol.upper()
                
            query_string = urlencode(params)
            signature = self._generate_signature(query_string)
            params['signature'] = signature
            
            url = f"{self.base_url}/openOrders"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url, 
                    params=params, 
                    headers=self._get_headers(), 
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    orders = response.json()
                    logger.info(f"📋 {len(orders)} órdenes abiertas encontradas")
                    return orders
                else:
                    logger.error(f"❌ Error obteniendo órdenes: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"❌ Error obteniendo órdenes: {e}")
            return []

    async def cancel_order(self, symbol: str, order_id: str) -> bool:
        """Cancelar una orden específica"""
        try:
            timestamp = int(time.time() * 1000)
            params = {
                'symbol': symbol.upper(),
                'orderId': order_id,
                'timestamp': timestamp
            }
            
            query_string = urlencode(params)
            signature = self._generate_signature(query_string)
            params['signature'] = signature
            
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/order",
                    data=params,
                    headers=self._get_headers(),
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"✅ Orden {order_id} cancelada")
                    return True
                else:
                    logger.error(f"❌ Error cancelando orden: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ Error cancelando orden {order_id}: {e}")
            return False


# 🧪 Testing del motor de trading
async def test_real_trading_engine():
    """Test del motor de trading real"""
    # IMPORTANTE: Usar credenciales de testnet
    api_key = "tu_testnet_api_key"  # Cambiar por credenciales reales
    api_secret = "tu_testnet_secret"
    
    engine = RealTradingEngine(
        api_key=api_key,
        api_secret=api_secret,
        use_testnet=True,
        enable_real_trading=False  # Modo simulación para testing
    )
    
    print("🧪 Testing RealTradingEngine...")
    
    # Test 1: Validar credenciales
    print("\n🔐 Test 1: Validar credenciales")
    if await engine.enable_trading():
        print("✅ Trading habilitado")
    else:
        print("❌ No se pudo habilitar trading - usando modo simulación")
    
    # Test 2: Balance
    print("\n💰 Test 2: Obtener balance")
    balance = await engine.get_balance("USDT")
    print(f"✅ Balance USDT: {balance}")
    
    # Test 3: Orden simulada
    print("\n🧪 Test 3: Orden simulada")
    order_result = await engine.execute_market_order(
        symbol="BTCUSDT",
        side="BUY",
        quantity=0.001,
        bot_id=1,
        strategy="Test"
    )
    print(f"✅ Orden: {'Exitosa' if order_result.success else 'Fallida'}")
    if order_result.success:
        print(f"✅ Precio ejecutado: ${order_result.executed_price:,.2f}")
        print(f"✅ Cantidad: {order_result.executed_qty}")
    
    # Test 4: Smart Scalper completo
    print("\n🎯 Test 4: Smart Scalper Trade")
    scalper_result = await engine.execute_smart_scalper_trade(
        symbol="BTCUSDT",
        bot_id=1,
        stake=100.0,
        risk_percentage=1.0
    )
    print(f"✅ Acción: {scalper_result['action']}")
    if 'signal' in scalper_result:
        print(f"✅ Señal: {scalper_result['signal']} ({scalper_result['confidence']:.0%})")

if __name__ == "__main__":
    # ADVERTENCIA: Solo ejecutar con credenciales de testnet
    print("⚠️ IMPORTANTE: Asegúrate de usar credenciales de TESTNET")
    print("Este código está configurado para usar testnet por defecto")
    # asyncio.run(test_real_trading_engine())