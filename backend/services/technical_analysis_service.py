#!/usr/bin/env python3
"""
🎯 TechnicalAnalysisService - Análisis técnico avanzado para estrategias de trading
Servicios especializados para Smart Scalper y otras estrategias

Eduard Guzmán - InteliBotX
"""

import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import logging
from services.binance_real_data import BinanceRealDataService

# Alternative TA functions (Railway compatible)
from services.ta_alternative import (
    calculate_rsi, get_rsi_status, calculate_sma, calculate_ema,
    calculate_atr, detect_volume_spike, calculate_volume_sma,
    calculate_bollinger_bands, calculate_price_change
)

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SmartScalperSignal:
    """Señal completa de Smart Scalper"""
    symbol: str
    timestamp: str
    signal: str
    confidence: float
    strength: str
    quality: str
    conditions_met: List[str]
    entry_price: float
    take_profit: float
    stop_loss: float
    risk_reward_ratio: float
    indicators: Dict[str, Any]
    algorithm_version: str

@dataclass
class TrendHunterSignal:
    """Señal de Trend Hunter"""
    symbol: str
    timestamp: str
    signal: str
    confidence: float
    trend_strength: str
    ema_alignment: bool
    macd_confirmation: bool
    support_resistance: Dict[str, float]
    indicators: Dict[str, Any]

class TechnicalAnalysisService:
    """Servicio principal de análisis técnico para todas las estrategias"""
    
    def __init__(self, use_testnet: bool = True):
        self.binance_service = BinanceRealDataService(use_testnet=use_testnet)
        self.strategies = {
            'Smart Scalper': self.analyze_smart_scalper,
            'Trend Hunter': self.analyze_trend_hunter,
            'Manipulation Detector': self.analyze_manipulation_detector,
            'News Sentiment': self.analyze_news_sentiment,
            'Volatility Master': self.analyze_volatility_master
        }
        
        logger.info("✅ TechnicalAnalysisService inicializado con 5 estrategias")

    async def analyze_smart_scalper(
        self, 
        symbol: str, 
        timeframe: str = '15m',
        stake: float = 1000.0,
        take_profit_pct: float = 2.5,
        stop_loss_pct: float = 1.5
    ) -> SmartScalperSignal:
        """
        Análisis completo Smart Scalper con datos reales
        
        Algoritmo:
        1. RSI < 30 (oversold) OR RSI > 70 (overbought)  
        2. Volume > 1.5x SMA(20) para confirmación
        3. Calcular TP/SL dinámico basado en ATR
        """
        try:
            logger.info(f"🎯 Analizando Smart Scalper para {symbol} {timeframe}")
            
            # Obtener indicadores técnicos reales
            indicators = await self.binance_service.calculate_technical_indicators(symbol, timeframe)
            current_price_data = await self.binance_service.get_current_price(symbol)
            current_price = current_price_data['price']
            
            # Variables del algoritmo
            conditions_met = []
            signal = "HOLD"
            confidence = 0.5
            
            # Condición 1: RSI Oversold/Overbought
            rsi_condition = None
            if indicators.rsi < 30:
                conditions_met.append("RSI_OVERSOLD")
                rsi_condition = "BUY"
            elif indicators.rsi > 70:
                conditions_met.append("RSI_OVERBOUGHT") 
                rsi_condition = "SELL"
            elif indicators.rsi < 40:
                rsi_condition = "WEAK_BUY"
            elif indicators.rsi > 60:
                rsi_condition = "WEAK_SELL"
                
            # Condición 2: Volume Spike Confirmation
            volume_confirmation = indicators.volume_spike
            if volume_confirmation:
                conditions_met.append("VOLUME_SPIKE")
                
            # Condición 3: Low Volatility (favorable para scalping)
            low_volatility = indicators.volatility < 2.5  # <2.5%
            if low_volatility:
                conditions_met.append("LOW_VOLATILITY")
                
            # Generar señal final según algoritmo Smart Scalper
            if rsi_condition == "BUY" and volume_confirmation:
                signal = "BUY"
                confidence = 0.88 if low_volatility else 0.75
            elif rsi_condition == "SELL" and volume_confirmation:
                signal = "SELL"
                confidence = 0.85 if low_volatility else 0.72
            elif rsi_condition == "WEAK_BUY" and volume_confirmation:
                signal = "WEAK_BUY"
                confidence = 0.68
            elif rsi_condition == "WEAK_SELL" and volume_confirmation:
                signal = "WEAK_SELL"
                confidence = 0.65
            elif rsi_condition in ["BUY", "SELL"]:
                signal = f"WEAK_{rsi_condition}"
                confidence = 0.55
                
            # Calcular TP/SL dinámico basado en ATR
            atr_multiplier = 2.0  # Standard para scalping
            dynamic_stop = indicators.atr * atr_multiplier
            
            if signal in ["BUY", "WEAK_BUY"]:
                entry_price = current_price
                stop_loss = entry_price - dynamic_stop
                take_profit = entry_price + (dynamic_stop * 2.1)  # R:R 2.1:1
            elif signal in ["SELL", "WEAK_SELL"]:
                entry_price = current_price
                stop_loss = entry_price + dynamic_stop
                take_profit = entry_price - (dynamic_stop * 2.1)
            else:
                entry_price = current_price
                stop_loss = current_price
                take_profit = current_price
                
            # Determinar calidad y fuerza
            quality = (
                "HIGH" if len(conditions_met) >= 3 else
                "MEDIUM" if len(conditions_met) >= 2 else
                "LOW"
            )
            
            strength = (
                "STRONG" if confidence > 0.8 else
                "MODERATE" if confidence > 0.65 else
                "WEAK"
            )
            
            # Risk/Reward ratio
            risk = abs(entry_price - stop_loss)
            reward = abs(take_profit - entry_price)
            rr_ratio = reward / risk if risk > 0 else 0
            
            smart_scalper_signal = SmartScalperSignal(
                symbol=symbol.upper(),
                timestamp=datetime.utcnow().isoformat(),
                signal=signal,
                confidence=round(confidence, 3),
                strength=strength,
                quality=quality,
                conditions_met=conditions_met,
                entry_price=round(entry_price, 2),
                take_profit=round(take_profit, 2),
                stop_loss=round(stop_loss, 2),
                risk_reward_ratio=round(rr_ratio, 2),
                indicators={
                    'rsi': indicators.rsi,
                    'rsi_status': indicators.rsi_status,
                    'volume_ratio': indicators.volume_ratio,
                    'volume_spike': indicators.volume_spike,
                    'volatility_pct': indicators.volatility,
                    'atr': indicators.atr,
                    'ema_9': indicators.ema_9,
                    'ema_21': indicators.ema_21,
                    'current_price': current_price
                },
                algorithm_version="Smart Scalper v2.1 Real Data"
            )
            
            logger.info(f"✅ Smart Scalper {symbol}: {signal} (conf: {confidence:.0%}, cond: {len(conditions_met)}/3)")
            return smart_scalper_signal
            
        except Exception as e:
            logger.error(f"❌ Error análisis Smart Scalper {symbol}: {e}")
            # Fallback signal
            return SmartScalperSignal(
                symbol=symbol,
                timestamp=datetime.utcnow().isoformat(),
                signal="HOLD",
                confidence=0.0,
                strength="ERROR",
                quality="LOW",
                conditions_met=[],
                entry_price=0.0,
                take_profit=0.0,
                stop_loss=0.0,
                risk_reward_ratio=0.0,
                indicators={'error': str(e)},
                algorithm_version="ERROR"
            )

    async def analyze_trend_hunter(self, symbol: str, timeframe: str = '1h') -> TrendHunterSignal:
        """
        Análisis Trend Hunter con EMA crossovers y MACD
        
        Algoritmo:
        1. EMA 9 > EMA 21 > EMA 50 (uptrend)
        2. MACD > Signal line (momentum confirmation)
        3. Support/Resistance levels
        """
        try:
            logger.info(f"📈 Analizando Trend Hunter para {symbol} {timeframe}")
            
            # Obtener datos más largos para trend analysis
            indicators = await self.binance_service.calculate_technical_indicators(symbol, timeframe, 200)
            current_price_data = await self.binance_service.get_current_price(symbol)
            
            # EMA Alignment
            ema_bullish = indicators.ema_9 > indicators.ema_21 > indicators.ema_50
            ema_bearish = indicators.ema_9 < indicators.ema_21 < indicators.ema_50
            
            # MACD Confirmation
            macd_bullish = indicators.macd > indicators.macd_signal
            macd_bearish = indicators.macd < indicators.macd_signal
            
            # Determinar señal de tendencia
            if ema_bullish and macd_bullish:
                signal = "BUY"
                confidence = 0.82
                trend_strength = "STRONG"
            elif ema_bearish and macd_bearish:
                signal = "SELL"
                confidence = 0.80
                trend_strength = "STRONG"
            elif ema_bullish or macd_bullish:
                signal = "WEAK_BUY"
                confidence = 0.65
                trend_strength = "MODERATE"
            elif ema_bearish or macd_bearish:
                signal = "WEAK_SELL"
                confidence = 0.63
                trend_strength = "MODERATE"
            else:
                signal = "HOLD"
                confidence = 0.50
                trend_strength = "WEAK"
                
            # Support/Resistance aproximado
            support_level = min(indicators.ema_21, indicators.ema_50)
            resistance_level = max(indicators.ema_21, indicators.ema_50) * 1.02
            
            trend_signal = TrendHunterSignal(
                symbol=symbol.upper(),
                timestamp=datetime.utcnow().isoformat(),
                signal=signal,
                confidence=round(confidence, 3),
                trend_strength=trend_strength,
                ema_alignment=ema_bullish or ema_bearish,
                macd_confirmation=macd_bullish or macd_bearish,
                support_resistance={
                    'support': round(support_level, 2),
                    'resistance': round(resistance_level, 2)
                },
                indicators={
                    'ema_9': indicators.ema_9,
                    'ema_21': indicators.ema_21,
                    'ema_50': indicators.ema_50,
                    'macd': indicators.macd,
                    'macd_signal': indicators.macd_signal,
                    'macd_histogram': indicators.macd_histogram
                }
            )
            
            logger.info(f"✅ Trend Hunter {symbol}: {signal} (tendencia: {trend_strength})")
            return trend_signal
            
        except Exception as e:
            logger.error(f"❌ Error análisis Trend Hunter {symbol}: {e}")
            return TrendHunterSignal(
                symbol=symbol,
                timestamp=datetime.utcnow().isoformat(),
                signal="HOLD",
                confidence=0.0,
                trend_strength="ERROR",
                ema_alignment=False,
                macd_confirmation=False,
                support_resistance={'support': 0.0, 'resistance': 0.0},
                indicators={'error': str(e)}
            )

    async def analyze_manipulation_detector(self, symbol: str, timeframe: str = '5m') -> Dict[str, Any]:
        """Detector de manipulación de mercado"""
        try:
            # Obtener datos de alta frecuencia
            df = await self.binance_service.get_klines(symbol, timeframe, 50)
            
            if df.empty:
                return {'symbol': symbol, 'manipulation_detected': False, 'confidence': 0.0}
                
            # Análisis de wicks largos (posible manipulación)
            df['body_size'] = abs(df['close'] - df['open'])
            df['upper_wick'] = df['high'] - df[['close', 'open']].max(axis=1)
            df['lower_wick'] = df[['close', 'open']].min(axis=1) - df['low']
            df['wick_ratio'] = (df['upper_wick'] + df['lower_wick']) / df['body_size']
            
            # Volume spikes anómalos
            volume_mean = df['volume'].rolling(20).mean()
            df['volume_ratio'] = df['volume'] / volume_mean
            
            # Detección de patrones sospechosos
            manipulation_signals = 0
            
            # Wicks excesivamente largos (>300% del cuerpo)
            if df['wick_ratio'].iloc[-1] > 3.0:
                manipulation_signals += 1
                
            # Volume spike extremo (>5x promedio)
            if df['volume_ratio'].iloc[-1] > 5.0:
                manipulation_signals += 1
                
            # Precio de cambios abruptos
            price_change = abs(df['close'].iloc[-1] - df['close'].iloc[-2]) / df['close'].iloc[-2]
            if price_change > 0.05:  # >5% en una vela
                manipulation_signals += 1
                
            manipulation_detected = manipulation_signals >= 2
            confidence = min(manipulation_signals * 0.35, 1.0)
            
            return {
                'symbol': symbol,
                'manipulation_detected': manipulation_detected,
                'confidence': round(confidence, 3),
                'signals_detected': manipulation_signals,
                'analysis': {
                    'wick_ratio': round(df['wick_ratio'].iloc[-1], 2),
                    'volume_spike': round(df['volume_ratio'].iloc[-1], 2),
                    'price_change_pct': round(price_change * 100, 2)
                },
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error análisis manipulación {symbol}: {e}")
            return {'symbol': symbol, 'manipulation_detected': False, 'confidence': 0.0, 'error': str(e)}

    async def analyze_news_sentiment(self, symbol: str) -> Dict[str, Any]:
        """Análisis de sentimiento de noticias (simulado por ahora)"""
        # TODO: Integrar con APIs de noticias reales (CoinGecko, NewsAPI)
        
        # Simulación de análisis de sentimiento
        sentiment_score = np.random.normal(0, 0.3)  # -1 a +1
        sentiment_score = max(-1, min(1, sentiment_score))
        
        if sentiment_score > 0.6:
            signal = "BUY"
            sentiment = "VERY_POSITIVE"
        elif sentiment_score > 0.2:
            signal = "WEAK_BUY"
            sentiment = "POSITIVE"
        elif sentiment_score < -0.6:
            signal = "SELL"
            sentiment = "VERY_NEGATIVE"
        elif sentiment_score < -0.2:
            signal = "WEAK_SELL"
            sentiment = "NEGATIVE"
        else:
            signal = "HOLD"
            sentiment = "NEUTRAL"
            
        return {
            'symbol': symbol,
            'signal': signal,
            'sentiment': sentiment,
            'sentiment_score': round(sentiment_score, 3),
            'confidence': round(abs(sentiment_score), 3),
            'news_count': np.random.randint(5, 20),
            'timestamp': datetime.utcnow().isoformat(),
            'note': 'Sentiment analysis simulado - próxima versión tendrá APIs reales'
        }

    async def analyze_volatility_master(self, symbol: str, timeframe: str = '15m') -> Dict[str, Any]:
        """Análisis de volatilidad dinámica"""
        try:
            indicators = await self.binance_service.calculate_technical_indicators(symbol, timeframe)
            
            # Clasificar volatilidad
            volatility = indicators.volatility
            
            if volatility > 3.0:
                volatility_level = "EXTREME"
                strategy = "avoid_trading"
            elif volatility > 2.0:
                volatility_level = "HIGH"
                strategy = "reduce_position_size"
            elif volatility > 1.0:
                volatility_level = "MODERATE"
                strategy = "normal_trading"
            else:
                volatility_level = "LOW"
                strategy = "increase_position_size"
                
            # Ajustar TP/SL según volatilidad
            if volatility_level in ["HIGH", "EXTREME"]:
                tp_multiplier = 1.5  # TP más conservador
                sl_multiplier = 0.8  # SL más ajustado
            else:
                tp_multiplier = 2.0  # TP estándar
                sl_multiplier = 1.0  # SL estándar
                
            return {
                'symbol': symbol,
                'volatility_level': volatility_level,
                'volatility_pct': round(volatility, 2),
                'strategy_recommendation': strategy,
                'position_size_adjustment': {
                    'tp_multiplier': tp_multiplier,
                    'sl_multiplier': sl_multiplier
                },
                'atr': indicators.atr,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error análisis volatilidad {symbol}: {e}")
            return {
                'symbol': symbol,
                'volatility_level': 'UNKNOWN',
                'error': str(e)
            }

    async def get_strategy_analysis(
        self, 
        strategy: str, 
        symbol: str, 
        timeframe: str = '15m',
        **kwargs
    ) -> Dict[str, Any]:
        """
        Obtener análisis para cualquier estrategia
        
        Args:
            strategy: Nombre de la estrategia
            symbol: Par de trading
            timeframe: Marco temporal
            **kwargs: Parámetros específicos de la estrategia
        """
        if strategy not in self.strategies:
            raise ValueError(f"Estrategia '{strategy}' no soportada. Disponibles: {list(self.strategies.keys())}")
            
        logger.info(f"🎯 Ejecutando análisis {strategy} para {symbol}")
        
        # Llamar al método correspondiente
        if strategy == 'Smart Scalper':
            result = await self.analyze_smart_scalper(symbol, timeframe, **kwargs)
            return asdict(result)
        elif strategy == 'Trend Hunter':
            result = await self.analyze_trend_hunter(symbol, timeframe)
            return asdict(result)
        elif strategy == 'Manipulation Detector':
            return await self.analyze_manipulation_detector(symbol, timeframe)
        elif strategy == 'News Sentiment':
            return await self.analyze_news_sentiment(symbol)
        elif strategy == 'Volatility Master':
            return await self.analyze_volatility_master(symbol, timeframe)
        else:
            raise ValueError(f"Estrategia {strategy} no implementada")


# 🧪 Testing del servicio
async def test_technical_analysis():
    """Test completo de análisis técnico"""
    service = TechnicalAnalysisService(use_testnet=True)
    
    print("🧪 Testing TechnicalAnalysisService...")
    
    # Test Smart Scalper
    print("\n🎯 Test Smart Scalper:")
    scalper_result = await service.get_strategy_analysis('Smart Scalper', 'BTCUSDT', '15m')
    print(f"✅ Señal: {scalper_result['signal']} (conf: {scalper_result['confidence']:.0%})")
    print(f"✅ Condiciones: {', '.join(scalper_result['conditions_met'])}")
    print(f"✅ TP: ${scalper_result['take_profit']:,.2f} | SL: ${scalper_result['stop_loss']:,.2f}")
    print(f"✅ R:R: {scalper_result['risk_reward_ratio']}:1")
    
    # Test Trend Hunter
    print("\n📈 Test Trend Hunter:")
    trend_result = await service.get_strategy_analysis('Trend Hunter', 'BTCUSDT', '1h')
    print(f"✅ Señal: {trend_result['signal']} (fuerza: {trend_result['trend_strength']})")
    print(f"✅ EMA alineadas: {trend_result['ema_alignment']}")
    print(f"✅ MACD confirmación: {trend_result['macd_confirmation']}")
    
    # Test Manipulation Detector
    print("\n🛡️ Test Manipulation Detector:")
    manipulation_result = await service.get_strategy_analysis('Manipulation Detector', 'BTCUSDT', '5m')
    print(f"✅ Manipulación detectada: {manipulation_result['manipulation_detected']}")
    print(f"✅ Confianza: {manipulation_result['confidence']:.0%}")
    
    print("\n🎉 Testing completado!")

if __name__ == "__main__":
    asyncio.run(test_technical_analysis())