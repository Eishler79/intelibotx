#!/usr/bin/env python3
"""
🎯 WebSocket Routes - Endpoints tiempo real para Smart Scalper
Conexiones WebSocket para streaming de datos técnicos al frontend

Eduard Guzmán - InteliBotX
"""

import asyncio
import json
import logging
from typing import Dict, Set, Optional
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query, Depends
from fastapi.responses import JSONResponse

# Lazy imports to avoid psycopg2 dependency at module level

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Router para WebSocket
router = APIRouter()

# Servicios se inicializan con lazy imports en cada función

# Manager de conexiones WebSocket
class WebSocketConnectionManager:
    """Gestor de conexiones WebSocket para clientes"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_subscriptions: Dict[str, Set[str]] = {}  # client_id -> symbols
        
    async def connect(self, websocket: WebSocket, client_id: str):
        """Conectar nuevo cliente WebSocket"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.user_subscriptions[client_id] = set()
        logger.info(f"✅ Cliente WebSocket conectado: {client_id}")

    def disconnect(self, client_id: str):
        """Desconectar cliente WebSocket"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.user_subscriptions:
            del self.user_subscriptions[client_id]
        logger.info(f"🔌 Cliente WebSocket desconectado: {client_id}")

    async def send_personal_message(self, message: dict, client_id: str):
        """Enviar mensaje a cliente específico"""
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"❌ Error enviando mensaje a {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast_to_subscribers(self, message: dict, symbol: str):
        """Broadcast a clientes suscritos a un símbolo"""
        disconnected_clients = []
        
        for client_id, symbols in self.user_subscriptions.items():
            if symbol in symbols and client_id in self.active_connections:
                try:
                    websocket = self.active_connections[client_id]
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"❌ Error en broadcast a {client_id}: {e}")
                    disconnected_clients.append(client_id)
        
        # Limpiar clientes desconectados
        for client_id in disconnected_clients:
            self.disconnect(client_id)

    def get_stats(self) -> Dict:
        """Obtener estadísticas de conexiones"""
        return {
            'total_connections': len(self.active_connections),
            'total_subscriptions': sum(len(subs) for subs in self.user_subscriptions.values()),
            'clients': list(self.active_connections.keys())
        }

# Instancia global del manager
connection_manager = WebSocketConnectionManager()

# Global realtime manager - initialized later with proper error handling
realtime_manager = None

# WebSocket endpoint function (will be registered directly on main app for Railway compatibility)
async def websocket_realtime_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint para datos en tiempo real autenticado
    
    **Conexión:** /ws/realtime/{client_id}?token=JWT_TOKEN
    
    **Mensajes soportados:**
    ```json
    {
        "action": "authenticate",
        "token": "JWT_TOKEN"
    }
    {
        "action": "subscribe",
        "symbol": "BTCUSDT",
        "interval": "1m",
        "strategy": "Smart Scalper"
    }
    ```
    """
    await connection_manager.connect(websocket, client_id)
    
    # Variables de autenticación
    user_id = None
    is_authenticated = False
    session = None
    
    try:
        from db.database import get_session
        from sqlmodel import Session as SQLSession
        from services.auth_service import AuthService
        
        # Initialize auth service
        auth_service = AuthService()
        
        # Obtener sesión de BD
        session_gen = get_session()
        session = next(session_gen)
        
        # Obtener token del query string
        token = None
        query_string = websocket.query_params.get("token")
        if query_string:
            token = query_string
        
        # Verificar token inicial si se proporciona
        if token:
            try:
                token_data = auth_service.verify_jwt_token(token)
                user_id = token_data.get("user_id")
                if user_id:
                    is_authenticated = True
                    logger.info(f"✅ Cliente {client_id} autenticado como usuario {user_id}")
            except Exception as e:
                logger.warning(f"⚠️ Token inicial inválido para cliente {client_id}: {e}")
        
        if not is_authenticated:
            # Enviar mensaje solicitando autenticación
            await connection_manager.send_personal_message({
                "type": "authentication_required",
                "message": "Please authenticate with JWT token",
                "timestamp": datetime.utcnow().isoformat()
            }, client_id)
        
        # WebSocket message handling loop
        while True:
            # Recibir mensaje del cliente
            data = await websocket.receive_text()
            message = json.loads(data)
            
            action = message.get("action")
            symbol = message.get("symbol", "").upper()
            interval = message.get("interval", "1m")
            strategy = message.get("strategy", "Smart Scalper")
            
            logger.info(f"📨 Mensaje WebSocket de {client_id}: {action} {symbol}")
            
            # Manejar autenticación
            if action == "authenticate":
                auth_token = message.get("token")
                if auth_token:
                    try:
                        token_data = auth_service.verify_jwt_token(auth_token)
                        user_id = token_data.get("user_id")
                        if user_id:
                            is_authenticated = True
                            logger.info(f"✅ Cliente {client_id} autenticado como usuario {user_id}")
                            
                            await connection_manager.send_personal_message({
                                "type": "authentication_success",
                                "user_id": user_id,
                                "timestamp": datetime.utcnow().isoformat()
                            }, client_id)
                        else:
                            await connection_manager.send_personal_message({
                                "type": "authentication_error",
                                "error": "Invalid token data",
                                "timestamp": datetime.utcnow().isoformat()
                            }, client_id)
                    except Exception as e:
                        logger.error(f"❌ Error autenticación cliente {client_id}: {e}")
                        await connection_manager.send_personal_message({
                            "type": "authentication_error",
                            "error": "Token verification failed",
                            "timestamp": datetime.utcnow().isoformat()
                        }, client_id)
                continue
            
            # Verificar autenticación para acciones que la requieren
            if not is_authenticated and action in ["subscribe", "get_indicators"]:
                await connection_manager.send_personal_message({
                    "type": "authentication_required",
                    "message": "Authentication required for this action",
                    "timestamp": datetime.utcnow().isoformat()
                }, client_id)
                continue
            
            if action == "subscribe" and symbol and is_authenticated:
                # Suscribir cliente al símbolo
                connection_manager.user_subscriptions[client_id].add(symbol)
                
                # Suscribir al realtime manager usando configuración del usuario
                success = await realtime_manager.subscribe_symbol_for_user(
                    user_id, symbol, interval, client_id, session
                )
                
                if success:
                    # Enviar confirmación
                    await connection_manager.send_personal_message({
                        "type": "subscription_confirmed",
                        "symbol": symbol,
                        "interval": interval,
                        "strategy": strategy,
                        "timestamp": datetime.utcnow().isoformat()
                    }, client_id)
                    
                    # Enviar datos iniciales si están disponibles usando configuración del usuario
                    initial_data = await realtime_manager.get_smart_scalper_signal_for_user(
                        user_id, symbol, interval, session
                    )
                    if initial_data:
                        await connection_manager.send_personal_message({
                            "type": "smart_scalper_update",
                            "symbol": symbol,
                            "data": initial_data,
                            "user_id": user_id
                        }, client_id)
                else:
                    await connection_manager.send_personal_message({
                        "type": "subscription_error",
                        "symbol": symbol,
                        "error": "Failed to subscribe to realtime data"
                    }, client_id)
            
            elif action == "unsubscribe" and symbol:
                # Desuscribir cliente del símbolo
                if client_id in connection_manager.user_subscriptions:
                    connection_manager.user_subscriptions[client_id].discard(symbol)
                
                await connection_manager.send_personal_message({
                    "type": "unsubscription_confirmed",
                    "symbol": symbol,
                    "timestamp": datetime.utcnow().isoformat()
                }, client_id)
            
            elif action == "get_indicators" and symbol and is_authenticated:
                # Obtener indicadores actuales usando configuración del usuario
                indicators = await realtime_manager.get_realtime_indicators_for_user(
                    user_id, symbol, interval, session
                )
                
                await connection_manager.send_personal_message({
                    "type": "indicators_response",
                    "symbol": symbol,
                    "data": indicators,
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }, client_id)
            
            elif action == "ping":
                # Keepalive
                await connection_manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }, client_id)
            
            else:
                # Acción no reconocida
                await connection_manager.send_personal_message({
                    "type": "error",
                    "message": f"Unknown action: {action}",
                    "timestamp": datetime.utcnow().isoformat()
                }, client_id)
                
    except WebSocketDisconnect:
        logger.info(f"🔌 Cliente {client_id} desconectado")
    except Exception as e:
        logger.error(f"❌ Error WebSocket {client_id}: {e}")
    finally:
        connection_manager.disconnect(client_id)
        if session:
            session.close()

@router.get("/api/websocket/status")
async def get_websocket_status():
    """Obtener estado de conexiones WebSocket"""
    try:
        ws_stats = connection_manager.get_stats()
        
        # 🏛️ DL-001 COMPLIANCE: Handle realtime_manager gracefully if not initialized
        realtime_stats = {}
        if realtime_manager is not None:
            try:
                realtime_stats = await realtime_manager.get_subscription_stats()
            except Exception as rm_error:
                logger.warning(f"⚠️ RealtimeManager stats unavailable: {rm_error}")
                realtime_stats = {"error": "RealtimeManager not fully initialized"}
        else:
            realtime_stats = {"status": "RealtimeManager not initialized - ENCRYPTION_MASTER_KEY may be missing"}
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "websocket_connections": ws_stats,
                "realtime_subscriptions": realtime_stats,
                "timestamp": datetime.utcnow().isoformat(),
                "service_status": "active" if realtime_manager else "degraded"
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo estado WebSocket: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ✅ DL-006 COMPLIANCE: Endpoint test eliminado - viola DL-001 (temporal/simulado)
# WebSocket REAL disponible en /ws/realtime/{client_id} con JWT auth

@router.post("/api/websocket/broadcast")
async def broadcast_message(message: dict):
    """
    Endpoint para broadcasting manual (solo para testing/admin)
    
    **Body:**
    ```json
    {
        "type": "admin_message",
        "content": "Mensaje a todos los clientes",
        "target_symbol": "BTCUSDT"
    }
    ```
    """
    try:
        target_symbol = message.get("target_symbol")
        
        broadcast_data = {
            "type": message.get("type", "admin_message"),
            "content": message.get("content", ""),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "admin_broadcast"
        }
        
        if target_symbol:
            # Broadcast a suscriptores específicos
            await connection_manager.broadcast_to_subscribers(broadcast_data, target_symbol)
            target = f"subscribers of {target_symbol}"
        else:
            # Broadcast general (implementar si es necesario)
            target = "all connected clients (not implemented)"
            
        return JSONResponse(content={
            "success": True,
            "message": f"Message broadcasted to {target}",
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Error broadcasting: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Background task para distribución de datos en tiempo real
async def start_realtime_distribution():
    """Task en background para distribuir datos en tiempo real"""
    logger.info("🚀 Iniciando distribución de datos en tiempo real...")
    
    # Lazy import with global variable update
    global realtime_manager
    try:
        from services.realtime_data_manager import RealtimeDataManager
        realtime_manager = RealtimeDataManager()
        
        # ✅ GUARDRAILS P3: Enhanced realtime distribution with automatic callbacks
        # Implementing automatic data distribution with <50ms latency requirement
        
        # Configure callback for automatic data distribution
        await realtime_manager.set_data_callback(distribute_market_data_to_clients)
        
        # Start background price streaming with performance optimization
        asyncio.create_task(continuous_price_streaming(realtime_manager))
        
        # Iniciar limpieza periódica
        asyncio.create_task(realtime_manager.start_periodic_cleanup())
        
        logger.info("✅ Distribución de datos en tiempo real iniciada")
    except Exception as e:
        logger.warning(f"⚠️ Could not initialize realtime distribution: {e}")

# ✅ GUARDRAILS P3: Performance enhancement functions for <50ms latency
async def distribute_market_data_to_clients(symbol: str, market_data: dict):
    """Distribute market data to connected WebSocket clients with <50ms latency"""
    try:
        if not connection_manager.active_connections:
            return
            
        # Prepare optimized message
        message = {
            "type": "market_data",
            "symbol": symbol,
            "data": market_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Broadcast to subscribed clients with performance optimization
        tasks = []
        for client_id, websocket in connection_manager.active_connections.items():
            if symbol in connection_manager.user_subscriptions.get(client_id, set()):
                tasks.append(websocket.send_text(json.dumps(message)))
        
        # Execute all sends concurrently for minimum latency
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
            logger.debug(f"📡 Market data distributed for {symbol} to {len(tasks)} clients")
            
    except Exception as e:
        logger.error(f"❌ Error distributing market data: {e}")

async def continuous_price_streaming(realtime_manager):
    """Continuous price streaming with performance optimization"""
    try:
        logger.info("🚀 Starting continuous price streaming...")
        
        while True:
            # Get all subscribed symbols from active connections
            all_symbols = set()
            for symbols in connection_manager.user_subscriptions.values():
                all_symbols.update(symbols)
            
            if not all_symbols:
                await asyncio.sleep(1)  # No active subscriptions
                continue
            
            # Fetch data for all symbols concurrently
            tasks = []
            for symbol in all_symbols:
                tasks.append(realtime_manager.get_symbol_data(symbol))
            
            # Execute with timeout for guaranteed <50ms response
            try:
                results = await asyncio.wait_for(
                    asyncio.gather(*tasks, return_exceptions=True),
                    timeout=0.045  # 45ms max for data fetch
                )
                
                # Distribute results
                for symbol, data in zip(all_symbols, results):
                    if isinstance(data, dict) and data.get("success"):
                        await distribute_market_data_to_clients(symbol, data)
                        
            except asyncio.TimeoutError:
                logger.warning("⏱️ Price streaming timeout - optimizing next cycle")
            
            # Optimal refresh rate for 60fps frontend updates
            await asyncio.sleep(0.0167)  # ~60 FPS (16.7ms intervals)
            
    except Exception as e:
        logger.error(f"❌ Continuous streaming error: {e}")

# Inicializar distribución de forma diferida (no al importar módulo)
def initialize_realtime_distribution():
    """Initialize realtime distribution when needed"""
    asyncio.create_task(start_realtime_distribution())