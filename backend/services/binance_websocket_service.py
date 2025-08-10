#!/usr/bin/env python3
"""
🎯 BinanceWebSocketService - Real-time data streaming para Smart Scalper
WebSocket connection para datos OHLCV y eventos en tiempo real

Eduard Guzmán - InteliBotX
"""

import asyncio
import json
import logging
import websockets
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import deque
import os

# Alternative TA functions (Railway compatible)
from services.ta_alternative import (
    calculate_rsi, get_rsi_status, calculate_sma, calculate_ema,
    calculate_atr, detect_volume_spike, calculate_volume_sma
)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RealtimeKline:
    """Estructura para datos de kline en tiempo real"""
    symbol: str
    open_time: int
    close_time: int
    open_price: float
    high_price: float
    low_price: float
    close_price: float
    volume: float
    interval: str
    is_closed: bool  # True si la vela está cerrada
    timestamp: str

@dataclass
class RealtimeTechnicalIndicators:
    """Indicadores técnicos calculados en tiempo real"""
    symbol: str
    timestamp: str
    rsi: float
    rsi_status: str  # OVERSOLD, OVERBOUGHT, NEUTRAL
    volume_sma: float
    volume_ratio: float  # Volumen actual vs SMA
    volume_spike: bool
    macd: float
    macd_signal: float
    macd_histogram: float
    ema_9: float
    ema_21: float
    ema_50: float
    atr: float
    smart_scalper_signal: str  # BUY, SELL, HOLD
    confidence: float

class BinanceWebSocketService:
    """Servicio WebSocket para datos en tiempo real de Binance"""
    
    def __init__(self, use_testnet: bool = True):
        self.use_testnet = use_testnet
        self.base_url = "wss://testnet.binance.vision/ws/" if use_testnet else "wss://stream.binance.com:9443/ws/"
        
        # Almacenar datos históricos para cálculos técnicos
        self.kline_buffers: Dict[str, deque] = {}  # symbol -> deque of klines
        self.buffer_size = 100  # Mantener últimas 100 velas
        
        # Callbacks para notificaciones
        self.kline_callbacks: List[Callable] = []
        self.indicator_callbacks: List[Callable] = []
        
        # Control de conexiones
        self.connections: Dict[str, Any] = {}  # stream_name -> websocket
        self.is_running = False
        
        logger.info(f"✅ BinanceWebSocketService {'testnet' if use_testnet else 'mainnet'} inicializado")

    async def subscribe_kline_stream(self, symbol: str, interval: str = "1m") -> str:
        """
        Suscribirse a stream de klines en tiempo real
        
        Args:
            symbol: Par de trading (ej: BTCUSDT)
            interval: Intervalo (1m, 5m, 15m, 1h, etc.)
            
        Returns:
            Stream name para control de la conexión
        """
        try:
            stream_name = f"{symbol.lower()}@kline_{interval}"
            url = f"{self.base_url}{stream_name}"
            
            logger.info(f"🔗 Conectando WebSocket: {stream_name}")
            
            # Crear buffer para este símbolo si no existe
            buffer_key = f"{symbol}_{interval}"
            if buffer_key not in self.kline_buffers:
                self.kline_buffers[buffer_key] = deque(maxlen=self.buffer_size)
            
            # Conectar WebSocket
            websocket = await websockets.connect(url)
            self.connections[stream_name] = websocket
            
            # Iniciar task para manejar mensajes
            asyncio.create_task(self._handle_kline_stream(websocket, symbol, interval))
            
            logger.info(f"✅ WebSocket conectado: {stream_name}")
            return stream_name
            
        except Exception as e:
            logger.error(f"❌ Error conectando WebSocket {symbol}: {e}")
            raise

    async def _handle_kline_stream(self, websocket, symbol: str, interval: str):
        """Manejar mensajes del stream de klines"""
        buffer_key = f"{symbol}_{interval}"
        
        try:
            async for message in websocket:
                data = json.loads(message)
                
                # Extraer datos de kline
                if 'k' in data:
                    kline_data = data['k']
                    
                    kline = RealtimeKline(
                        symbol=kline_data['s'],
                        open_time=kline_data['t'],
                        close_time=kline_data['T'],
                        open_price=float(kline_data['o']),
                        high_price=float(kline_data['h']),
                        low_price=float(kline_data['l']),
                        close_price=float(kline_data['c']),
                        volume=float(kline_data['v']),
                        interval=kline_data['i'],
                        is_closed=kline_data['x'],
                        timestamp=datetime.utcnow().isoformat()
                    )
                    
                    # Solo procesar velas cerradas para cálculos técnicos
                    if kline.is_closed:
                        # Agregar al buffer
                        self.kline_buffers[buffer_key].append(kline)
                        
                        # Calcular indicadores técnicos si tenemos suficientes datos
                        if len(self.kline_buffers[buffer_key]) >= 50:
                            indicators = await self._calculate_realtime_indicators(symbol, interval)
                            
                            # Notificar callbacks
                            await self._notify_indicator_callbacks(indicators)
                        
                        # Notificar callbacks de kline
                        await self._notify_kline_callbacks(kline)
                        
                        logger.debug(f"📊 {symbol} {interval}: {kline.close_price} (Vol: {kline.volume:.0f})")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.warning(f"⚠️ WebSocket desconectado: {symbol} {interval}")
        except Exception as e:
            logger.error(f"❌ Error en stream {symbol}: {e}")

    async def _calculate_realtime_indicators(self, symbol: str, interval: str) -> RealtimeTechnicalIndicators:
        """Calcular indicadores técnicos con datos en tiempo real"""
        try:
            buffer_key = f"{symbol}_{interval}"
            klines = list(self.kline_buffers[buffer_key])
            
            if len(klines) < 50:
                raise ValueError(f"Insuficientes datos para cálculo: {len(klines)}")
            
            # Convertir a listas para funciones alternativas
            closes = [k.close_price for k in klines]
            highs = [k.high_price for k in klines]
            lows = [k.low_price for k in klines]
            volumes = [k.volume for k in klines]
            
            # Calcular indicadores usando funciones alternativas (Railway compatible)
            rsi = calculate_rsi(closes, period=14)
            volume_sma = calculate_volume_sma(volumes, period=20)
            volume_ratio = volumes[-1] / volume_sma if volume_sma > 0 else 1.0
            
            # Simplificar MACD para Railway (usar EMAs)
            ema_12 = calculate_ema(closes, 12)
            ema_26 = calculate_ema(closes, 26)
            macd = ema_12 - ema_26
            macd_signal = calculate_ema([macd] * 9, 9)  # Aproximación simple
            macd_hist = macd - macd_signal
            
            ema_9 = calculate_ema(closes, 9)
            ema_21 = calculate_ema(closes, 21)
            ema_50 = calculate_ema(closes, 50)
            atr = calculate_atr(highs, lows, closes, period=14)
            
            # Determinar estado RSI usando función alternativa
            rsi_status = get_rsi_status(rsi)
            
            # Detectar spike de volumen usando función alternativa
            volume_spike, volume_ratio = detect_volume_spike(volumes)
            
            # Generar señal Smart Scalper
            signal, confidence = self._generate_smart_scalper_signal(
                rsi, rsi_status, volume_spike, volume_ratio, atr, closes[-1]
            )
            
            return RealtimeTechnicalIndicators(
                symbol=symbol,
                timestamp=datetime.utcnow().isoformat(),
                rsi=round(rsi, 2),
                rsi_status=rsi_status,
                volume_sma=round(volume_sma, 2),
                volume_ratio=round(volume_ratio, 2),
                volume_spike=volume_spike,
                macd=round(macd[-1], 6),
                macd_signal=round(macd_signal[-1], 6),
                macd_histogram=round(macd_hist[-1], 6),
                ema_9=round(ema_9, 6),
                ema_21=round(ema_21, 6),
                ema_50=round(ema_50, 6),
                atr=round(atr, 6),
                smart_scalper_signal=signal,
                confidence=round(confidence, 3)
            )
            
        except Exception as e:
            logger.error(f"❌ Error calculando indicadores {symbol}: {e}")
            raise

    def _generate_smart_scalper_signal(self, rsi: float, rsi_status: str, 
                                     volume_spike: bool, volume_ratio: float, 
                                     atr: float, current_price: float) -> tuple[str, float]:
        """Generar señal Smart Scalper basada en algoritmo documentado"""
        
        # Condiciones principales del algoritmo
        rsi_oversold = rsi < 30
        rsi_overbought = rsi > 70
        volume_confirmed = volume_spike
        
        # Evaluación de volatilidad (ATR bajo es mejor para scalping)
        volatility_acceptable = atr < (current_price * 0.002)  # ATR < 0.2% del precio
        
        signal = "HOLD"
        confidence = 0.5
        
        # Señal de compra
        if rsi_oversold and volume_confirmed:
            signal = "BUY"
            confidence = 0.85 if volatility_acceptable else 0.75
        elif rsi_oversold:
            signal = "WEAK_BUY"
            confidence = 0.65
        
        # Señal de venta
        elif rsi_overbought and volume_confirmed:
            signal = "SELL"
            confidence = 0.82 if volatility_acceptable else 0.72
        elif rsi_overbought:
            signal = "WEAK_SELL"
            confidence = 0.62
        
        # Ajustar confianza por volumen adicional
        if volume_ratio > 2.0:
            confidence += 0.05
        elif volume_ratio > 3.0:
            confidence += 0.10
        
        confidence = min(confidence, 0.95)  # Cap en 95%
        
        return signal, confidence

    async def subscribe_multiple_symbols(self, symbols: List[str], interval: str = "1m") -> List[str]:
        """Suscribirse a múltiples símbolos simultáneamente"""
        stream_names = []
        
        for symbol in symbols:
            try:
                stream_name = await self.subscribe_kline_stream(symbol, interval)
                stream_names.append(stream_name)
                await asyncio.sleep(0.1)  # Evitar rate limiting
            except Exception as e:
                logger.error(f"❌ Error suscribiendo {symbol}: {e}")
        
        logger.info(f"✅ Suscrito a {len(stream_names)} símbolos WebSocket")
        return stream_names

    def add_kline_callback(self, callback: Callable[[RealtimeKline], None]):
        """Agregar callback para notificaciones de nuevas klines"""
        self.kline_callbacks.append(callback)

    def add_indicator_callback(self, callback: Callable[[RealtimeTechnicalIndicators], None]):
        """Agregar callback para notificaciones de indicadores actualizados"""
        self.indicator_callbacks.append(callback)

    async def _notify_kline_callbacks(self, kline: RealtimeKline):
        """Notificar callbacks de kline"""
        for callback in self.kline_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(kline)
                else:
                    callback(kline)
            except Exception as e:
                logger.error(f"❌ Error en callback kline: {e}")

    async def _notify_indicator_callbacks(self, indicators: RealtimeTechnicalIndicators):
        """Notificar callbacks de indicadores"""
        for callback in self.indicator_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(indicators)
                else:
                    callback(indicators)
            except Exception as e:
                logger.error(f"❌ Error en callback indicadores: {e}")

    async def get_current_indicators(self, symbol: str, interval: str = "1m") -> Optional[RealtimeTechnicalIndicators]:
        """Obtener indicadores actuales calculados"""
        try:
            return await self._calculate_realtime_indicators(symbol, interval)
        except Exception as e:
            logger.error(f"❌ Error obteniendo indicadores actuales {symbol}: {e}")
            return None

    async def close_stream(self, stream_name: str):
        """Cerrar stream específico"""
        if stream_name in self.connections:
            try:
                await self.connections[stream_name].close()
                del self.connections[stream_name]
                logger.info(f"🔌 Stream cerrado: {stream_name}")
            except Exception as e:
                logger.error(f"❌ Error cerrando stream {stream_name}: {e}")

    async def close_all_streams(self):
        """Cerrar todas las conexiones WebSocket"""
        logger.info(f"🔌 Cerrando {len(self.connections)} conexiones WebSocket...")
        
        for stream_name in list(self.connections.keys()):
            await self.close_stream(stream_name)
        
        self.is_running = False
        logger.info("✅ Todas las conexiones WebSocket cerradas")

    def get_buffer_status(self) -> Dict[str, Any]:
        """Obtener estado de los buffers de datos"""
        status = {}
        for buffer_key, buffer in self.kline_buffers.items():
            status[buffer_key] = {
                'size': len(buffer),
                'max_size': buffer.maxlen,
                'latest_timestamp': buffer[-1].timestamp if buffer else None
            }
        return status


# 🧪 Testing del servicio WebSocket
async def test_websocket_service():
    """Test del servicio WebSocket"""
    print("🧪 Testing BinanceWebSocketService...")
    
    service = BinanceWebSocketService(use_testnet=True)
    
    # Callback para mostrar indicadores
    async def on_indicators_update(indicators: RealtimeTechnicalIndicators):
        print(f"📊 {indicators.symbol}: RSI={indicators.rsi:.1f} ({indicators.rsi_status}) | "
              f"Vol={indicators.volume_ratio:.1f}x | Signal={indicators.smart_scalper_signal} "
              f"({indicators.confidence:.0%})")
    
    # Callback para klines
    async def on_kline_update(kline: RealtimeKline):
        if kline.is_closed:
            print(f"🕯️ {kline.symbol}: {kline.close_price} | Vol: {kline.volume:.0f}")
    
    # Agregar callbacks
    service.add_indicator_callback(on_indicators_update)
    service.add_kline_callback(on_kline_update)
    
    try:
        # Suscribirse a BTCUSDT
        await service.subscribe_kline_stream("BTCUSDT", "1m")
        
        # Ejecutar por 30 segundos
        await asyncio.sleep(30)
        
        # Obtener estado de buffers
        status = service.get_buffer_status()
        print(f"📋 Buffer status: {status}")
        
    except KeyboardInterrupt:
        print("⏹️ Test interrumpido por usuario")
    finally:
        await service.close_all_streams()
    
    print("✅ Test WebSocket completado")

if __name__ == "__main__":
    asyncio.run(test_websocket_service())