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

from services.realtime_data_manager import RealtimeDataManager
from services.auth_service import AuthService
from services.user_trading_service import UserTradingService
from db.database import get_session

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Router para WebSocket
router = APIRouter()

# Servicios globales
realtime_manager = RealtimeDataManager()  # Ya no hardcodea testnet
auth_service = AuthService()
user_trading_service = UserTradingService()

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

@router.websocket("/ws/realtime/{client_id}")
async def websocket_realtime_endpoint(websocket: WebSocket, client_id: str, token: str = None):
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
        
        # Obtener sesión de BD
        session_gen = get_session()
        session = next(session_gen)
        
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
        realtime_stats = await realtime_manager.get_subscription_stats()
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "websocket_connections": ws_stats,
                "realtime_subscriptions": realtime_stats,
                "timestamp": datetime.utcnow().isoformat(),
                "service_status": "active"
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
    
    # TODO: Implementar distribución automática cuando haya callbacks del realtime manager
    # Por ahora, los datos se envían bajo demanda via WebSocket messages
    
    # Iniciar limpieza periódica
    asyncio.create_task(realtime_manager.start_periodic_cleanup())
    
    logger.info("✅ Distribución de datos en tiempo real iniciada")

# Inicializar distribución al importar el módulo
asyncio.create_task(start_realtime_distribution())