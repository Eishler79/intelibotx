#!/usr/bin/env python3
"""
🧪 Test WebSocket Implementation - InteliBotX
Script para verificar la funcionalidad WebSocket de datos en tiempo real

Eduard Guzmán - InteliBotX
"""

import asyncio
import json
import logging
import websockets
import httpx
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WebSocketTester:
    """Tester para funcionalidad WebSocket"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.ws_url = base_url.replace("http://", "ws://").replace("https://", "wss://")
        
    async def get_test_token(self):
        """Obtener token JWT para testing (admin user)"""
        try:
            async with httpx.AsyncClient() as client:
                # ✅ DL-001 COMPLIANCE: Use real registered user for testing
                login_data = {
                    "email": "test@example.com",
                    "password": "testpass123"
                }
                
                response = await client.post(
                    f"{self.base_url}/auth/login", 
                    data=login_data  # form data
                )
                
                if response.status_code == 200:
                    data = response.json()
                    token = data.get("access_token")
                    logger.info("✅ Token de test obtenido exitosamente")
                    return token
                else:
                    logger.error(f"❌ Error login: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Error obteniendo token: {e}")
            return None
        
    async def test_websocket_connection(self, symbol: str = "BTCUSDT"):
        """Test conexión WebSocket básica con autenticación"""
        client_id = f"test_client_{int(datetime.now().timestamp())}"
        
        # Obtener token de test (admin user)
        token = await self.get_test_token()
        if not token:
            logger.error("❌ No se pudo obtener token de test")
            return
        
        websocket_url = f"{self.ws_url}/ws/realtime/{client_id}?token={token}"
        
        logger.info(f"🔗 Conectando a WebSocket: {websocket_url}")
        
        try:
            async with websockets.connect(websocket_url) as websocket:
                logger.info("✅ Conexión WebSocket establecida")
                
                # 1. Esperar respuesta de autenticación
                auth_response = await websocket.recv()
                auth_data = json.loads(auth_response)
                logger.info(f"🔐 Respuesta autenticación: {auth_data.get('type')}")
                
                if auth_data.get('type') != 'authentication_success':
                    logger.error("❌ Falló autenticación WebSocket")
                    return
                
                # 2. Test suscripción
                subscribe_message = {
                    "action": "subscribe",
                    "symbol": symbol,
                    "interval": "1m",
                    "strategy": "Smart Scalper"
                }
                
                await websocket.send(json.dumps(subscribe_message))
                logger.info(f"📤 Enviada suscripción a {symbol}")
                
                # 3. Recibir confirmación de suscripción
                response = await websocket.recv()
                data = json.loads(response)
                logger.info(f"📥 Respuesta: {data['type']} - {data.get('symbol', 'N/A')}")
                
                # 3. Test ping/pong
                ping_message = {"action": "ping"}
                await websocket.send(json.dumps(ping_message))
                
                pong_response = await websocket.recv()
                pong_data = json.loads(pong_response)
                logger.info(f"🏓 Ping/Pong: {pong_data['type']}")
                
                # 4. Test obtener indicadores
                indicators_message = {
                    "action": "get_indicators",
                    "symbol": symbol,
                    "interval": "1m"
                }
                
                await websocket.send(json.dumps(indicators_message))
                indicators_response = await websocket.recv()
                indicators_data = json.loads(indicators_response)
                logger.info(f"📊 Indicadores: {indicators_data['type']}")
                
                if indicators_data.get('data'):
                    data = indicators_data['data']
                    if data:
                        logger.info(f"   RSI: {data.get('rsi', 'N/A')}")
                        logger.info(f"   Señal: {data.get('smart_scalper_signal', 'N/A')}")
                        logger.info(f"   Confianza: {data.get('confidence', 'N/A')}")
                
                # 5. Escuchar actualizaciones por 10 segundos
                logger.info("👂 Escuchando actualizaciones en tiempo real...")
                
                try:
                    for i in range(10):
                        response = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(response)
                        logger.info(f"📈 Update #{i+1}: {data.get('type', 'unknown')} - {data.get('symbol', 'N/A')}")
                except asyncio.TimeoutError:
                    logger.info("⏰ Timeout esperando actualizaciones (normal)")
                
                # 6. Test desuscripción
                unsubscribe_message = {
                    "action": "unsubscribe",
                    "symbol": symbol
                }
                
                await websocket.send(json.dumps(unsubscribe_message))
                unsub_response = await websocket.recv()
                unsub_data = json.loads(unsub_response)
                logger.info(f"📤 Desuscripción: {unsub_data['type']}")
                
                logger.info("✅ Test WebSocket completado exitosamente")
                
        except Exception as e:
            logger.error(f"❌ Error en test WebSocket: {e}")
            raise

    async def test_rest_endpoints(self):
        """Test endpoints REST relacionados"""
        logger.info("🔍 Testing REST endpoints...")
        
        # Obtener token para endpoints autenticados
        token = await self.get_test_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        
        async with httpx.AsyncClient() as client:
            # 1. Test estado WebSocket
            try:
                response = await client.get(f"{self.base_url}/api/websocket/status")
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✅ Estado WebSocket: {data['data']['service_status']}")
                    logger.info(f"   Conexiones: {data['data']['websocket_connections']['total_connections']}")
                else:
                    logger.warning(f"⚠️ Estado WebSocket: {response.status_code}")
            except Exception as e:
                logger.error(f"❌ Error estado WebSocket: {e}")
            
            # 2. Test data de prueba (con usuario específico)
            try:
                response = await client.get(f"{self.base_url}/api/websocket/test/BTCUSDT?user_id=1")
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"✅ Test data: {data['data']['symbol']} (Usuario {data['data']['user_id']})")
                    
                    signal_data = data['data'].get('smart_scalper_signal', {})
                    logger.info(f"   Señal: {signal_data.get('signal', 'N/A')} ({signal_data.get('confidence', 0):.0%})")
                else:
                    logger.warning(f"⚠️ Test data: {response.status_code}")
            except Exception as e:
                logger.error(f"❌ Error test data: {e}")
            
            # 3. Test estado trading del usuario (autenticado)
            if token:
                try:
                    response = await client.get(f"{self.base_url}/api/user/trading-status", headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        user_data = data['data']
                        logger.info(f"✅ Estado trading usuario: {user_data['user']['email']}")
                        logger.info(f"   Exchanges: {user_data['exchanges']['total_exchanges']}")
                        logger.info(f"   Trading disponible: {user_data['trading_available']}")
                    else:
                        logger.warning(f"⚠️ Estado trading: {response.status_code}")
                except Exception as e:
                    logger.error(f"❌ Error estado trading: {e}")

    async def test_binance_websocket_direct(self, symbol: str = "BTCUSDT"):
        """Test directo del servicio WebSocket de Binance"""
        logger.info("🔗 Testing conexión directa Binance WebSocket...")
        
        from services.binance_websocket_service import BinanceWebSocketService
        
        service = BinanceWebSocketService(use_testnet=True)
        
        # Callback para mostrar actualizaciones
        async def on_indicators_update(indicators):
            logger.info(f"📊 Actualización {indicators.symbol}: "
                       f"RSI={indicators.rsi:.1f} | "
                       f"Señal={indicators.smart_scalper_signal} "
                       f"({indicators.confidence:.0%})")
        
        service.add_indicator_callback(on_indicators_update)
        
        try:
            # Suscribirse
            stream_name = await service.subscribe_kline_stream(symbol, "1m")
            logger.info(f"✅ Suscrito a stream: {stream_name}")
            
            # Esperar datos
            await asyncio.sleep(5)
            
            # Obtener indicadores actuales
            indicators = await service.get_current_indicators(symbol, "1m")
            if indicators:
                logger.info(f"📈 Indicadores actuales: RSI={indicators.rsi:.1f}, "
                           f"Señal={indicators.smart_scalper_signal}")
            
            # Obtener estado de buffers
            status = service.get_buffer_status()
            logger.info(f"📋 Buffer status: {len(status)} buffers activos")
            
        except Exception as e:
            logger.error(f"❌ Error en test directo: {e}")
        finally:
            await service.close_all_streams()
            logger.info("🔌 Streams cerrados")

async def run_all_tests():
    """Ejecutar todos los tests"""
    tester = WebSocketTester()
    
    logger.info("🚀 Iniciando tests WebSocket InteliBotX...")
    logger.info("=" * 60)
    
    try:
        # 1. Test conexión directa Binance
        await tester.test_binance_websocket_direct()
        await asyncio.sleep(2)
        
        # 2. Test endpoints REST
        await tester.test_rest_endpoints()
        await asyncio.sleep(2)
        
        # 3. Test WebSocket completo (requiere servidor corriendo)
        logger.info("\n" + "=" * 60)
        logger.info("⚠️ Para test WebSocket completo, servidor debe estar corriendo en puerto 8000")
        logger.info("Ejecutar: uvicorn main:app --reload")
        
        try:
            await tester.test_websocket_connection()
        except Exception as e:
            logger.warning(f"⚠️ Test WebSocket completo falló (servidor no disponible): {e}")
        
    except KeyboardInterrupt:
        logger.info("⏹️ Tests interrumpidos por usuario")
    except Exception as e:
        logger.error(f"❌ Error en tests: {e}")
    
    logger.info("=" * 60)
    logger.info("✅ Tests completados")

if __name__ == "__main__":
    asyncio.run(run_all_tests())