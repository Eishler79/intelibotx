#!/usr/bin/env python3
"""
🎯 RealtimeDataManager - Gestor central de datos en tiempo real
Coordina WebSockets, caché y distribución de datos para Smart Scalper

Eduard Guzmán - InteliBotX
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, Set
from datetime import datetime, timedelta
from dataclasses import asdict
import redis
from contextlib import asynccontextmanager

from services.binance_websocket_service import (
    BinanceWebSocketService, 
    RealtimeKline, 
    RealtimeTechnicalIndicators
)
from services.user_trading_service import UserTradingService
from services.technical_analysis_service import TechnicalAnalysisService
from models.user import User
from models.user_exchange import UserExchange
from sqlmodel import Session

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealtimeDataManager:
    """Gestor central para datos en tiempo real y WebSockets basado en usuarios"""
    
    def __init__(self):
        # WebSocket services por usuario (testnet/mainnet según configuración)
        self.user_websocket_services: Dict[str, BinanceWebSocketService] = {}
        self.user_trading_service = UserTradingService()
        
        # Configurar Redis para caché (opcional)
        self.redis_client = None
        try:
            self.redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
            self.redis_client.ping()
            logger.info("✅ Redis conectado para caché")
        except:
            logger.warning("⚠️ Redis no disponible - usando caché en memoria")
        
        # Caché en memoria como fallback
        self.memory_cache: Dict[str, Any] = {}
        self.cache_ttl = 60  # TTL en segundos
        
        # Suscripciones activas por usuario
        self.user_subscriptions: Dict[str, Dict[str, datetime]] = {}  # user_id -> {symbol_interval -> last_activity}
        self.subscription_cleanup_interval = 300  # 5 minutos
        
        # Clients conectados por usuario
        self.connected_users: Dict[str, Set[str]] = {}  # user_id -> client_ids
        
        logger.info("✅ RealtimeDataManager inicializado (modo usuario)")

    async def get_user_websocket_service(self, user_id: int, session: Session) -> Optional[BinanceWebSocketService]:
        """
        Obtener WebSocket service para un usuario específico basado en su configuración
        
        Args:
            user_id: ID del usuario
            session: Sesión de base de datos
            
        Returns:
            BinanceWebSocketService configurado según exchanges del usuario
        """
        try:
            user_key = str(user_id)
            
            # Si ya existe, devolverlo
            if user_key in self.user_websocket_services:
                return self.user_websocket_services[user_key]
            
            # Obtener exchanges del usuario
            exchanges = await self.user_trading_service.get_user_exchanges(user_id, session)
            
            if not exchanges:
                logger.warning(f"⚠️ Usuario {user_id} no tiene exchanges configurados")
                # Crear servicio testnet por defecto (seguro)
                websocket_service = BinanceWebSocketService(use_testnet=True)
                self.user_websocket_services[user_key] = websocket_service
                return websocket_service
            
            # Usar configuración del primer exchange activo
            primary_exchange = exchanges[0]
            use_testnet = primary_exchange.is_testnet
            
            logger.info(f"📊 Usuario {user_id}: Usando {'testnet' if use_testnet else 'mainnet'}")
            
            # Crear servicio WebSocket con configuración correcta
            websocket_service = BinanceWebSocketService(use_testnet=use_testnet)
            
            # Configurar callbacks específicos del usuario
            await self._setup_user_callbacks(websocket_service, user_id)
            
            # Almacenar servicio
            self.user_websocket_services[user_key] = websocket_service
            
            return websocket_service
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo WebSocket service para usuario {user_id}: {e}")
            # Fallback a testnet seguro
            websocket_service = BinanceWebSocketService(use_testnet=True)
            self.user_websocket_services[str(user_id)] = websocket_service
            return websocket_service

    async def _setup_user_callbacks(self, websocket_service: BinanceWebSocketService, user_id: int):
        """Configurar callbacks específicos por usuario"""
        
        async def on_kline_update(kline: RealtimeKline):
            """Callback para actualizaciones de kline del usuario"""
            if kline.is_closed:
                # Caché específico por usuario
                cache_key = f"user:{user_id}:kline:{kline.symbol}:{kline.interval}"
                await self._cache_set(cache_key, asdict(kline), ttl=self.cache_ttl)
                
                logger.debug(f"💾 Cached kline usuario {user_id}: {kline.symbol} @ {kline.close_price}")
        
        async def on_indicators_update(indicators: RealtimeTechnicalIndicators):
            """Callback para actualizaciones de indicadores del usuario"""
            # Caché específico por usuario
            cache_key = f"user:{user_id}:indicators:{indicators.symbol}"
            await self._cache_set(cache_key, asdict(indicators), ttl=self.cache_ttl)
            
            # Log señales importantes
            if indicators.smart_scalper_signal in ['BUY', 'SELL'] and indicators.confidence > 0.75:
                logger.info(f"🎯 SEÑAL FUERTE Usuario {user_id}: {indicators.symbol} {indicators.smart_scalper_signal} "
                           f"({indicators.confidence:.0%}) - RSI: {indicators.rsi:.1f}")
        
        # Registrar callbacks
        websocket_service.add_kline_callback(on_kline_update)
        websocket_service.add_indicator_callback(on_indicators_update)

    def _setup_callbacks(self):
        """Configurar callbacks para WebSocket"""
        
        async def on_kline_update(kline: RealtimeKline):
            """Callback para actualizaciones de kline"""
            if kline.is_closed:
                # Actualizar caché con nueva vela cerrada
                cache_key = f"kline:{kline.symbol}:{kline.interval}"
                await self._cache_set(cache_key, asdict(kline), ttl=self.cache_ttl)
                
                logger.debug(f"💾 Cached kline: {kline.symbol} @ {kline.close_price}")
        
        async def on_indicators_update(indicators: RealtimeTechnicalIndicators):
            """Callback para actualizaciones de indicadores"""
            # Actualizar caché con nuevos indicadores
            cache_key = f"indicators:{indicators.symbol}"
            await self._cache_set(cache_key, asdict(indicators), ttl=self.cache_ttl)
            
            # Log señales importantes
            if indicators.smart_scalper_signal in ['BUY', 'SELL'] and indicators.confidence > 0.75:
                logger.info(f"🎯 SEÑAL FUERTE: {indicators.symbol} {indicators.smart_scalper_signal} "
                           f"({indicators.confidence:.0%}) - RSI: {indicators.rsi:.1f}")
        
        # Registrar callbacks
        self.websocket_service.add_kline_callback(on_kline_update)
        self.websocket_service.add_indicator_callback(on_indicators_update)

    async def subscribe_symbol_for_user(self, user_id: int, symbol: str, interval: str = "1m", 
                                       client_id: str = None, session: Session = None) -> bool:
        """
        Suscribirse a datos en tiempo real para un símbolo usando configuración del usuario
        
        Args:
            user_id: ID del usuario
            symbol: Par de trading
            interval: Intervalo temporal
            client_id: ID del cliente WebSocket (opcional)
            session: Sesión de base de datos
            
        Returns:
            True si la suscripción fue exitosa
        """
        try:
            if not session:
                logger.error("❌ Sesión de BD requerida para suscripción por usuario")
                return False
            
            # Obtener WebSocket service del usuario
            websocket_service = await self.get_user_websocket_service(user_id, session)
            if not websocket_service:
                return False
            
            subscription_key = f"{symbol}_{interval}"
            user_key = str(user_id)
            
            # Inicializar estructuras del usuario si no existen
            if user_key not in self.user_subscriptions:
                self.user_subscriptions[user_key] = {}
            if user_key not in self.connected_users:
                self.connected_users[user_key] = set()
            
            # Agregar cliente si se especifica
            if client_id:
                self.connected_users[user_key].add(client_id)
            
            # Verificar si ya estamos suscritos
            if subscription_key in self.user_subscriptions[user_key]:
                # Actualizar timestamp de última actividad
                self.user_subscriptions[user_key][subscription_key] = datetime.utcnow()
                logger.debug(f"🔄 Renovada suscripción usuario {user_id}: {subscription_key}")
                return True
            
            # Crear nueva suscripción
            stream_name = await websocket_service.subscribe_kline_stream(symbol, interval)
            
            if stream_name:
                self.user_subscriptions[user_key][subscription_key] = datetime.utcnow()
                
                # Log contexto del usuario
                context_info = f" (cliente: {client_id})" if client_id else ""
                logger.info(f"✅ Nueva suscripción usuario {user_id}: {subscription_key}{context_info}")
                
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Error suscribiendo {symbol} para usuario {user_id}: {e}")
            return False

    async def get_realtime_indicators_for_user(self, user_id: int, symbol: str, interval: str = "1m", 
                                             session: Session = None) -> Optional[Dict[str, Any]]:
        """
        Obtener indicadores técnicos en tiempo real desde caché específico del usuario
        
        Args:
            user_id: ID del usuario
            symbol: Par de trading
            interval: Intervalo temporal
            session: Sesión de base de datos
            
        Returns:
            Indicadores técnicos o None si no están disponibles
        """
        try:
            if not session:
                logger.error("❌ Sesión de BD requerida para indicadores por usuario")
                return None
            
            # Intentar desde caché específico del usuario primero
            cache_key = f"user:{user_id}:indicators:{symbol}"
            cached_data = await self._cache_get(cache_key)
            
            if cached_data:
                logger.debug(f"📊 Indicadores desde caché usuario {user_id}: {symbol}")
                return cached_data
            
            # Si no están en caché, calcular usando WebSocket service del usuario
            websocket_service = await self.get_user_websocket_service(user_id, session)
            if not websocket_service:
                return None
            
            indicators = await websocket_service.get_current_indicators(symbol, interval)
            
            if indicators:
                # Guardar en caché específico del usuario
                await self._cache_set(cache_key, asdict(indicators), ttl=self.cache_ttl)
                return asdict(indicators)
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo indicadores {symbol} para usuario {user_id}: {e}")
            return None

    async def get_smart_scalper_signal_for_user(self, user_id: int, symbol: str, interval: str = "1m",
                                              session: Session = None) -> Dict[str, Any]:
        """
        Obtener señal específica de Smart Scalper para un usuario
        
        Args:
            user_id: ID del usuario
            symbol: Par de trading
            interval: Intervalo temporal
            session: Sesión de base de datos
            
        Returns:
            Señal Smart Scalper con metadatos
        """
        try:
            indicators = await self.get_realtime_indicators_for_user(user_id, symbol, interval, session)
            
            if not indicators:
                return {
                    'signal': 'HOLD',
                    'confidence': 0.5,
                    'error': 'No realtime data available',
                    'timestamp': datetime.utcnow().isoformat(),
                    'user_id': user_id
                }
            
            return {
                'signal': indicators.get('smart_scalper_signal', 'HOLD'),
                'confidence': indicators.get('confidence', 0.5),
                'rsi': indicators.get('rsi', 50),
                'rsi_status': indicators.get('rsi_status', 'NEUTRAL'),
                'volume_spike': indicators.get('volume_spike', False),
                'volume_ratio': indicators.get('volume_ratio', 1.0),
                'conditions_met': self._get_conditions_met(indicators),
                'timestamp': indicators.get('timestamp'),
                'data_source': f'websocket_realtime_user_{user_id}',
                'user_id': user_id
            }
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo señal Smart Scalper {symbol} para usuario {user_id}: {e}")
            return {
                'signal': 'HOLD',
                'confidence': 0.0,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat(),
                'user_id': user_id
            }

    def _get_conditions_met(self, indicators: Dict[str, Any]) -> List[str]:
        """Determinar qué condiciones del algoritmo Smart Scalper se cumplen"""
        conditions = []
        
        rsi = indicators.get('rsi', 50)
        volume_spike = indicators.get('volume_spike', False)
        volume_ratio = indicators.get('volume_ratio', 1.0)
        
        if rsi < 30:
            conditions.append('RSI_OVERSOLD')
        elif rsi > 70:
            conditions.append('RSI_OVERBOUGHT')
        
        if volume_spike:
            conditions.append('VOLUME_SPIKE')
        elif volume_ratio > 1.2:
            conditions.append('VOLUME_ELEVATED')
        
        return conditions

    async def cleanup_inactive_subscriptions(self):
        """Limpiar suscripciones inactivas para optimizar recursos"""
        try:
            current_time = datetime.utcnow()
            inactive_subscriptions = []
            
            for subscription_key, last_activity in self.active_subscriptions.items():
                if (current_time - last_activity).seconds > self.subscription_cleanup_interval:
                    inactive_subscriptions.append(subscription_key)
            
            # Cerrar suscripciones inactivas
            for subscription_key in inactive_subscriptions:
                symbol, interval = subscription_key.split('_', 1)
                stream_name = f"{symbol.lower()}@kline_{interval}"
                
                await self.websocket_service.close_stream(stream_name)
                del self.active_subscriptions[subscription_key]
                
                logger.info(f"🧹 Suscripción inactiva eliminada: {subscription_key}")
            
            if inactive_subscriptions:
                logger.info(f"✅ Limpiadas {len(inactive_subscriptions)} suscripciones inactivas")
                
        except Exception as e:
            logger.error(f"❌ Error en limpieza de suscripciones: {e}")

    async def start_periodic_cleanup(self):
        """Iniciar tarea periódica de limpieza"""
        while True:
            try:
                await asyncio.sleep(self.subscription_cleanup_interval)
                await self.cleanup_inactive_subscriptions()
            except Exception as e:
                logger.error(f"❌ Error en limpieza periódica: {e}")
                await asyncio.sleep(60)  # Retry en 1 minuto

    async def get_subscription_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de suscripciones activas"""
        return {
            'total_subscriptions': len(self.active_subscriptions),
            'active_subscriptions': list(self.active_subscriptions.keys()),
            'websocket_connections': len(self.websocket_service.connections),
            'buffer_status': self.websocket_service.get_buffer_status(),
            'cache_type': 'redis' if self.redis_client else 'memory',
            'cache_size': len(self.memory_cache),
            'uptime': datetime.utcnow().isoformat()
        }

    # Métodos de caché
    async def _cache_set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Guardar en caché (Redis o memoria)"""
        try:
            if self.redis_client:
                serialized = json.dumps(value)
                if ttl:
                    return self.redis_client.setex(key, ttl, serialized)
                else:
                    return self.redis_client.set(key, serialized)
            else:
                # Caché en memoria con TTL simple
                expiry = datetime.utcnow() + timedelta(seconds=ttl or self.cache_ttl)
                self.memory_cache[key] = {'value': value, 'expiry': expiry}
                return True
        except Exception as e:
            logger.error(f"❌ Error guardando en caché {key}: {e}")
            return False

    async def _cache_get(self, key: str) -> Optional[Any]:
        """Obtener desde caché (Redis o memoria)"""
        try:
            if self.redis_client:
                cached = self.redis_client.get(key)
                return json.loads(cached) if cached else None
            else:
                # Verificar caché en memoria
                if key in self.memory_cache:
                    entry = self.memory_cache[key]
                    if datetime.utcnow() < entry['expiry']:
                        return entry['value']
                    else:
                        del self.memory_cache[key]
                        return None
                return None
        except Exception as e:
            logger.error(f"❌ Error obteniendo de caché {key}: {e}")
            return None

    async def close(self):
        """Cerrar todas las conexiones y limpiar recursos"""
        logger.info("🔌 Cerrando RealtimeDataManager...")
        
        await self.websocket_service.close_all_streams()
        
        if self.redis_client:
            self.redis_client.close()
        
        self.memory_cache.clear()
        self.active_subscriptions.clear()
        
        logger.info("✅ RealtimeDataManager cerrado")


# 🧪 Testing del manager
async def test_realtime_data_manager():
    """Test del gestor de datos en tiempo real"""
    print("🧪 Testing RealtimeDataManager...")
    
    manager = RealtimeDataManager(use_testnet=True)
    
    try:
        # Suscribirse a BTCUSDT
        success = await manager.subscribe_symbol("BTCUSDT", "1m", "test_user")
        print(f"✅ Suscripción: {'exitosa' if success else 'falló'}")
        
        # Esperar datos
        await asyncio.sleep(10)
        
        # Obtener indicadores
        indicators = await manager.get_realtime_indicators("BTCUSDT", "1m")
        if indicators:
            print(f"📊 RSI: {indicators['rsi']:.1f} | Señal: {indicators['smart_scalper_signal']}")
        
        # Obtener señal Smart Scalper
        signal = await manager.get_smart_scalper_signal("BTCUSDT", "1m")
        print(f"🎯 Señal: {signal['signal']} ({signal['confidence']:.0%})")
        
        # Estadísticas
        stats = await manager.get_subscription_stats()
        print(f"📋 Suscripciones activas: {stats['total_subscriptions']}")
        
    except KeyboardInterrupt:
        print("⏹️ Test interrumpido")
    finally:
        await manager.close()
    
    print("✅ Test completado")

if __name__ == "__main__":
    asyncio.run(test_realtime_data_manager())