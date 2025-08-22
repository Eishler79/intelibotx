#!/usr/bin/env python3
"""
🎯 UserTradingService - Trading real basado en exchanges configurados por usuario
Integración del sistema trading real con el sistema de gestión de exchanges existente

Eduard Guzmán - InteliBotX
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from sqlmodel import Session, select

from models.user import User
from models.user_exchange import UserExchange
from services.encryption_service import EncryptionService
from services.exchange_factory import ExchangeFactory
from services.technical_analysis_service import TechnicalAnalysisService
from services.execution_metrics import ExecutionMetricsTracker
from services.real_trading_engine import RealTradingEngine, TradeResult

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserTradingService:
    """Servicio de trading que usa exchanges configurados por usuario"""
    
    def __init__(self):
        self.encryption_service = EncryptionService()
        self.exchange_factory = ExchangeFactory(self.encryption_service)
        self.technical_service = TechnicalAnalysisService(use_testnet=True)
        self.metrics_tracker = ExecutionMetricsTracker()
        
        # Cache de engines por usuario/exchange
        self.user_trading_engines: Dict[str, RealTradingEngine] = {}
        
        logger.info("✅ UserTradingService inicializado")

    async def get_user_exchanges(self, user_id: int, session: Session) -> List[UserExchange]:
        """Obtener exchanges activos del usuario"""
        try:
            statement = select(UserExchange).where(
                UserExchange.user_id == user_id,
                UserExchange.status == "active"
            )
            exchanges = session.exec(statement).all()
            
            logger.info(f"📋 Usuario {user_id} tiene {len(exchanges)} exchanges activos")
            return exchanges
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo exchanges usuario {user_id}: {e}")
            # 🚨 Re-raise para manejar adecuadamente en endpoints
            raise RuntimeError(f"Database error getting user exchanges: {e}")

    async def get_user_trading_engine(
        self, 
        user_id: int, 
        exchange_id: int, 
        session: Session
    ) -> Optional[RealTradingEngine]:
        """
        Obtener motor de trading para un exchange específico del usuario
        
        Args:
            user_id: ID del usuario
            exchange_id: ID del exchange configurado
            session: Sesión de base de datos
            
        Returns:
            RealTradingEngine configurado o None si hay error
        """
        try:
            # Cache key
            cache_key = f"{user_id}_{exchange_id}"
            
            if cache_key in self.user_trading_engines:
                logger.info(f"🔄 Usando engine en cache para usuario {user_id}")
                return self.user_trading_engines[cache_key]
            
            # Obtener configuración del exchange
            exchange = session.get(UserExchange, exchange_id)
            if not exchange or exchange.user_id != user_id:
                logger.error(f"❌ Exchange {exchange_id} no encontrado o no pertenece al usuario {user_id}")
                return None
            
            if exchange.status != "active":
                logger.error(f"❌ Exchange {exchange_id} no está activo: {exchange.status}")
                return None
            
            # Desencriptar credenciales
            try:
                api_key = self.encryption_service.decrypt_api_key(exchange.encrypted_api_key)
                api_secret = self.encryption_service.decrypt_api_key(exchange.encrypted_api_secret)
            except Exception as e:
                logger.error(f"❌ Error desencriptando credenciales: {e}")
                return None
            
            # Crear motor de trading
            trading_engine = RealTradingEngine(
                api_key=api_key,
                api_secret=api_secret,
                use_testnet=exchange.is_testnet,
                enable_real_trading=True  # Usuario ya configuró sus credenciales
            )
            
            # Habilitar trading con validación
            if await trading_engine.enable_trading():
                self.user_trading_engines[cache_key] = trading_engine
                logger.info(f"✅ Motor de trading creado para usuario {user_id} - {exchange.connection_name}")
                return trading_engine
            else:
                logger.error(f"❌ No se pudo habilitar trading para exchange {exchange_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error creando motor de trading: {e}")
            return None

    async def get_user_technical_analysis(
        self, 
        user_id: int,
        symbol: str, 
        strategy: str = "Smart Scalper",
        timeframe: str = "15m",
        session: Session = None
    ) -> Dict[str, Any]:
        """
        Obtener análisis técnico usando configuración del usuario
        
        Args:
            user_id: ID del usuario
            symbol: Par de trading
            strategy: Estrategia de análisis
            timeframe: Marco temporal
            session: Sesión de BD (opcional)
            
        Returns:
            Análisis técnico completo con datos del usuario
        """
        try:
            logger.info(f"🎯 Análisis técnico para usuario {user_id}: {strategy} {symbol}")
            
            # Obtener exchanges del usuario para determinar testnet/mainnet
            exchanges = []
            if session:
                exchanges = await self.get_user_exchanges(user_id, session)
            
            # Determinar si usar testnet basado en configuración del usuario
            use_testnet = True  # Default seguro
            if exchanges:
                # Usar configuración del primer exchange activo
                use_testnet = exchanges[0].is_testnet
                logger.info(f"📊 Usando {'testnet' if use_testnet else 'mainnet'} según configuración usuario")
            
            # Crear servicio técnico con configuración correcta
            user_technical_service = TechnicalAnalysisService(use_testnet=use_testnet)
            
            # Obtener análisis
            analysis = await user_technical_service.get_strategy_analysis(
                strategy=strategy,
                symbol=symbol,
                timeframe=timeframe
            )
            
            # Agregar metadatos del usuario
            analysis['user_context'] = {
                'user_id': user_id,
                'exchanges_configured': len(exchanges),
                'using_testnet': use_testnet,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Error análisis técnico usuario {user_id}: {e}")
            return {
                'error': str(e),
                'user_id': user_id,
                'symbol': symbol,
                'strategy': strategy
            }

    async def execute_user_trade(
        self,
        user_id: int,
        exchange_id: int,
        symbol: str,
        side: str,
        quantity: float,
        bot_id: int,
        strategy: str = "Manual",
        session: Session = None
    ) -> TradeResult:
        """
        Ejecutar trade usando exchange configurado del usuario
        
        Args:
            user_id: ID del usuario
            exchange_id: ID del exchange a usar
            symbol: Par de trading
            side: BUY/SELL
            quantity: Cantidad
            bot_id: ID del bot
            strategy: Estrategia
            session: Sesión de BD
            
        Returns:
            TradeResult con resultado de la ejecución
        """
        try:
            logger.info(f"🚀 Ejecutando trade usuario {user_id}: {side} {quantity} {symbol}")
            
            if not session:
                logger.error("❌ Sesión de BD requerida para ejecutar trade")
                return self._create_error_result(symbol, side, quantity, "Database session required")
            
            # Obtener motor de trading del usuario
            trading_engine = await self.get_user_trading_engine(user_id, exchange_id, session)
            
            if not trading_engine:
                return self._create_error_result(symbol, side, quantity, f"No se pudo obtener motor trading para exchange {exchange_id}")
            
            # Ejecutar orden
            result = await trading_engine.execute_market_order(
                symbol=symbol,
                side=side,
                quantity=quantity,
                bot_id=bot_id,
                strategy=strategy
            )
            
            logger.info(f"{'✅' if result.success else '❌'} Trade usuario {user_id}: {result.status}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error ejecutando trade usuario {user_id}: {e}")
            return self._create_error_result(symbol, side, quantity, str(e))

    async def execute_user_smart_scalper_trade(
        self,
        user_id: int,
        exchange_id: int,
        symbol: str,
        bot_id: int,
        stake: float = 1000.0,
        risk_percentage: float = 1.0,
        session: Session = None
    ) -> Dict[str, Any]:
        """
        Ejecutar trade Smart Scalper completo para usuario específico
        
        Integra análisis técnico + ejecución usando configuración del usuario
        """
        try:
            logger.info(f"🎯 Smart Scalper trade usuario {user_id}: {symbol} (${stake})")
            
            if not session:
                return {
                    'action': 'ERROR',
                    'error': 'Database session required',
                    'user_id': user_id
                }
            
            # 1. Obtener análisis técnico específico del usuario
            analysis = await self.get_user_technical_analysis(
                user_id=user_id,
                symbol=symbol,
                strategy="Smart Scalper",
                timeframe="15m",
                session=session
            )
            
            if 'error' in analysis:
                return {
                    'action': 'ANALYSIS_ERROR',
                    'error': analysis['error'],
                    'user_id': user_id
                }
            
            # 2. Evaluar señal
            signal = analysis.get('signal', 'HOLD')
            confidence = analysis.get('confidence', 0)
            
            if signal == 'HOLD' or confidence < 0.65:
                logger.info(f"⏸️ No trading usuario {user_id}: {signal} (conf: {confidence:.0%})")
                return {
                    'action': 'NO_TRADE',
                    'reason': f'{signal} - Confianza insuficiente ({confidence:.0%})',
                    'analysis': analysis,
                    'user_id': user_id
                }
            
            # 3. Obtener motor de trading
            trading_engine = await self.get_user_trading_engine(user_id, exchange_id, session)
            
            if not trading_engine:
                return {
                    'action': 'ENGINE_ERROR',
                    'error': f'No se pudo crear motor trading para exchange {exchange_id}',
                    'user_id': user_id
                }
            
            # 4. Ejecutar con motor del usuario
            result = await trading_engine.execute_smart_scalper_trade(
                symbol=symbol,
                bot_id=bot_id,
                stake=stake,
                risk_percentage=risk_percentage
            )
            
            # Agregar contexto de usuario
            result['user_context'] = {
                'user_id': user_id,
                'exchange_id': exchange_id,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            logger.info(f"🎯 Smart Scalper resultado usuario {user_id}: {result['action']}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error Smart Scalper usuario {user_id}: {e}")
            return {
                'action': 'ERROR',
                'error': str(e),
                'user_id': user_id,
                'timestamp': datetime.utcnow().isoformat()
            }

    def _create_error_result(self, symbol: str, side: str, quantity: float, error_message: str) -> TradeResult:
        """Crear resultado de error"""
        from services.real_trading_engine import TradeResult
        
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

    async def get_user_exchange_status(
        self, 
        user_id: int, 
        session: Session
    ) -> Dict[str, Any]:
        """
        Obtener estado de exchanges del usuario
        
        Útil para mostrar en UI qué exchanges están disponibles
        """
        try:
            exchanges = await self.get_user_exchanges(user_id, session)
            
            exchange_status = []
            for exchange in exchanges:
                # Test rápido de conexión si es necesario
                connection_ok = exchange.status == "active" and exchange.last_test_at
                
                exchange_info = {
                    'id': exchange.id,
                    'name': exchange.connection_name,
                    'exchange': exchange.exchange_name,
                    'is_testnet': exchange.is_testnet,
                    'status': exchange.status,
                    'last_test': exchange.last_test_at.isoformat() if exchange.last_test_at else None,
                    'connection_ok': connection_ok,
                    'permissions': exchange.get_permissions(),
                    'error': exchange.error_message
                }
                exchange_status.append(exchange_info)
            
            return {
                'user_id': user_id,
                'total_exchanges': len(exchanges),
                'active_exchanges': len([e for e in exchanges if e.status == 'active']),
                'exchanges': exchange_status,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo estado exchanges usuario {user_id}: {e}")
            return {
                'user_id': user_id,
                'error': str(e),
                'exchanges': []
            }


# 🧪 Testing del servicio
async def test_user_trading_service():
    """Test del servicio de trading por usuario"""
    print("🧪 Testing UserTradingService...")
    
    service = UserTradingService()
    
    # TODO: Este test requeriría una sesión de BD real con usuario configurado
    print("✅ UserTradingService inicializado correctamente")
    print("💡 Para testing completo se requiere usuario con exchanges configurados")
    
if __name__ == "__main__":
    asyncio.run(test_user_trading_service())