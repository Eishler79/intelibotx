# 🏛️ SignalQualityAssessor - INSTITUCIONAL ÚNICAMENTE (DL-002)
# SPEC_REF: SMART_SCALPER_STRATEGY.md#signal-quality + DECISION_LOG.md DL-002

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import pandas as pd
import numpy as np
from datetime import datetime

@dataclass
class InstitutionalSignalQuality:
    """Resultado de evaluación de calidad INSTITUCIONAL"""
    overall_score: float  # 0-100
    confidence_level: str  # "LOW", "MEDIUM", "HIGH", "INSTITUTIONAL"
    institutional_confirmations: Dict[str, Any]
    manipulation_alerts: List[str]
    smart_money_recommendation: str  # "INSTITUTIONAL_BUY", "INSTITUTIONAL_SELL", "ACCUMULATION", "DISTRIBUTION", "WAIT"

@dataclass
class InstitutionalConfirmation:
    """Confirmación institucional individual"""
    name: str
    score: float  # 0-100
    bias: str     # "SMART_MONEY", "RETAIL_TRAP", "INSTITUTIONAL_NEUTRAL"
    details: Dict[str, Any]

class SignalQualityAssessor:
    """
    🏛️ INSTITUCIONAL: Multi-confirmation validation usando SOLO algoritmos Smart Money
    
    ELIMINADOS (DL-002): RSI, MACD, EMA básicos (nivel retail)
    ALGORITMOS CORE INSTITUCIONALES:
    1. Wyckoff Method Analysis
    2. Order Blocks Confirmation  
    3. Liquidity Grabs Detection
    4. Stop Hunting Analysis
    5. Fair Value Gaps Assessment
    6. Market Microstructure Validation
    """
    
    def __init__(self):
        self.min_institutional_confirmations = 3  # Mínimo 3/6 confirmaciones institucionales
        self.institutional_thresholds = {
            "INSTITUTIONAL": 85,  # Solo para algoritmos Smart Money
            "HIGH": 70,
            "MEDIUM": 55,
            "LOW": 40
        }
        
    def assess_signal_quality(
        self, 
        price_data: pd.DataFrame,
        volume_data: List[float],
        indicators: Dict[str, float],  # Ignorado - solo institucionales
        market_structure: Dict[str, Any],
        timeframe: str = "15m"
    ) -> InstitutionalSignalQuality:
        """
        🏛️ INSTITUCIONAL: Evaluar calidad usando SOLO Smart Money algorithms
        
        Args:
            price_data: DataFrame con OHLCV
            volume_data: Lista de volúmenes  
            indicators: IGNORADO (solo retail - violación DL-002)
            market_structure: Análisis institucional
            timeframe: Marco temporal
            
        Returns:
            InstitutionalSignalQuality con evaluación Smart Money
        """
        try:
            # 1. 🏛️ WYCKOFF METHOD ANALYSIS
            wyckoff_confirmation = self._evaluate_wyckoff_analysis(
                price_data, volume_data, market_structure
            )
            
            # 2. 📦 ORDER BLOCKS CONFIRMATION  
            order_blocks_confirmation = self._evaluate_order_blocks(
                price_data, volume_data
            )
            
            # 3. 🎯 LIQUIDITY GRABS DETECTION
            liquidity_confirmation = self._evaluate_liquidity_grabs(
                price_data, volume_data
            )
            
            # 4. 🕳️ STOP HUNTING ANALYSIS
            stop_hunting_confirmation = self._evaluate_stop_hunting(
                price_data, volume_data
            )
            
            # 5. ⚡ FAIR VALUE GAPS ASSESSMENT
            fvg_confirmation = self._evaluate_fair_value_gaps(
                price_data
            )
            
            # 6. 🔬 MARKET MICROSTRUCTURE VALIDATION
            microstructure_confirmation = self._evaluate_market_microstructure(
                price_data, volume_data
            )
            
            # Compilar confirmaciones INSTITUCIONALES
            institutional_confirmations = {
                "wyckoff_method": wyckoff_confirmation,
                "order_blocks": order_blocks_confirmation, 
                "liquidity_grabs": liquidity_confirmation,
                "stop_hunting": stop_hunting_confirmation,
                "fair_value_gaps": fvg_confirmation,
                "market_microstructure": microstructure_confirmation
            }
            
            # Calcular score institucional y determinar calidad Smart Money
            overall_score, confidence_level, smart_money_recommendation = self._calculate_institutional_quality(
                institutional_confirmations
            )
            
            # Identificar alertas de manipulación
            manipulation_alerts = self._identify_manipulation_alerts(institutional_confirmations)
            
            return InstitutionalSignalQuality(
                overall_score=overall_score,
                confidence_level=confidence_level,
                institutional_confirmations=institutional_confirmations,
                manipulation_alerts=manipulation_alerts,
                smart_money_recommendation=smart_money_recommendation
            )
            
        except Exception as e:
            # Fallback institucional
            return InstitutionalSignalQuality(
                overall_score=0.0,
                confidence_level="LOW",
                institutional_confirmations={},
                manipulation_alerts=[f"Error in institutional assessment: {str(e)}"],
                smart_money_recommendation="WAIT"
            )
    
    def _evaluate_wyckoff_analysis(
        self, 
        price_data: pd.DataFrame,
        volume_data: List[float], 
        market_structure: Dict[str, Any]
    ) -> InstitutionalConfirmation:
        """🏛️ Evaluar Wyckoff Method - Accumulation/Distribution phases"""
        try:
            score = 0
            details = {}
            
            if len(price_data) < 50:
                return InstitutionalConfirmation(
                    name="Wyckoff Analysis",
                    score=20,
                    bias="INSTITUTIONAL_NEUTRAL",
                    details={"error": "Insufficient data for Wyckoff analysis"}
                )
            
            closes = price_data['close'].values
            volumes = np.array(volume_data[-len(closes):]) if len(volume_data) >= len(closes) else np.array(volume_data)
            highs = price_data['high'].values
            lows = price_data['low'].values
            
            # Wyckoff Phase Detection
            wyckoff_phase = market_structure.get('wyckoff_phase', 'UNKNOWN')
            
            # Phase-specific scoring
            if wyckoff_phase in ['ACCUMULATION', 'MARKUP']:
                phase_score = 35  # Strong institutional buying
                phase_bias = "SMART_MONEY"
                phase_recommendation = "ACCUMULATION"
            elif wyckoff_phase in ['DISTRIBUTION', 'MARKDOWN']:
                phase_score = 25  # Institutional selling
                phase_bias = "SMART_MONEY" 
                phase_recommendation = "DISTRIBUTION"
            else:
                phase_score = 15  # Neutral/unknown phase
                phase_bias = "INSTITUTIONAL_NEUTRAL"
                phase_recommendation = "WAIT"
                
            score += phase_score
            details['wyckoff_phase'] = {
                'current_phase': wyckoff_phase,
                'score': phase_score,
                'bias': phase_bias,
                'recommendation': phase_recommendation
            }
            
            # Volume vs Price Divergence (Wyckoff principle)
            if len(closes) >= 20 and len(volumes) >= 20:
                recent_price_change = (closes[-5:].mean() - closes[-20:-15].mean()) / closes[-20:-15].mean()
                recent_volume_change = (volumes[-5:].mean() - volumes[-20:-15].mean()) / volumes[-20:-15].mean()
                
                # Wyckoff: Falling prices + Rising volume = Accumulation
                # Rising prices + Falling volume = Distribution
                if recent_price_change < -0.02 and recent_volume_change > 0.1:  # Accumulation signal
                    divergence_score = 30
                    divergence_type = "ACCUMULATION_DIVERGENCE"
                    divergence_bias = "SMART_MONEY"
                elif recent_price_change > 0.02 and recent_volume_change < -0.1:  # Distribution signal
                    divergence_score = 25
                    divergence_type = "DISTRIBUTION_DIVERGENCE" 
                    divergence_bias = "SMART_MONEY"
                else:
                    divergence_score = 15
                    divergence_type = "NO_DIVERGENCE"
                    divergence_bias = "INSTITUTIONAL_NEUTRAL"
            else:
                recent_price_change = 0
                recent_volume_change = 0
                divergence_score = 10
                divergence_type = "INSUFFICIENT_DATA"
                divergence_bias = "INSTITUTIONAL_NEUTRAL"
                
            score += divergence_score
            details['price_volume_divergence'] = {
                'price_change': recent_price_change,
                'volume_change': recent_volume_change,
                'divergence_type': divergence_type,
                'score': divergence_score,
                'bias': divergence_bias
            }
            
            # Determine overall Wyckoff bias
            if score >= 50:
                bias = "SMART_MONEY"
            elif score >= 30:
                bias = "INSTITUTIONAL_NEUTRAL" 
            else:
                bias = "RETAIL_TRAP"
                
            return InstitutionalConfirmation(
                name="Wyckoff Analysis",
                score=min(score, 100),
                bias=bias,
                details=details
            )
            
        except Exception as e:
            return InstitutionalConfirmation(
                name="Wyckoff Analysis",
                score=0,
                bias="INSTITUTIONAL_NEUTRAL",
                details={"error": str(e)}
            )
    
    def _evaluate_order_blocks(
        self, 
        price_data: pd.DataFrame,
        volume_data: List[float]
    ) -> InstitutionalConfirmation:
        """📦 Evaluar Order Blocks - Zonas institucionales de entrada/salida"""
        try:
            score = 0
            details = {}
            
            if len(price_data) < 30:
                return InstitutionalConfirmation(
                    name="Order Blocks",
                    score=10,
                    bias="INSTITUTIONAL_NEUTRAL",
                    details={"error": "Insufficient data for Order Blocks analysis"}
                )
            
            opens = price_data['open'].values
            highs = price_data['high'].values
            lows = price_data['low'].values
            closes = price_data['close'].values
            volumes = np.array(volume_data[-len(closes):]) if len(volume_data) >= len(closes) else np.array(volume_data)
            
            current_price = closes[-1]
            
            # Identify Bullish Order Blocks (last bearish candle before strong bullish move)
            bullish_blocks = []
            for i in range(2, len(closes) - 5):  # Leave room for confirmation
                if (closes[i] < opens[i] and  # Bearish candle
                    volumes[i] > volumes[i-5:i].mean() * 1.2 and  # Above average volume
                    closes[i+1:i+4].min() > highs[i]):  # Price never returned to this level
                    
                    block_strength = volumes[i] / volumes[i-10:i].mean() if i >= 10 else 1
                    bullish_blocks.append({
                        'price_level': highs[i],
                        'strength': block_strength,
                        'age': len(closes) - i
                    })
            
            # Identify Bearish Order Blocks (last bullish candle before strong bearish move)
            bearish_blocks = []
            for i in range(2, len(closes) - 5):
                if (closes[i] > opens[i] and  # Bullish candle
                    volumes[i] > volumes[i-5:i].mean() * 1.2 and  # Above average volume
                    closes[i+1:i+4].max() < lows[i]):  # Price never returned to this level
                    
                    block_strength = volumes[i] / volumes[i-10:i].mean() if i >= 10 else 1
                    bearish_blocks.append({
                        'price_level': lows[i],
                        'strength': block_strength,
                        'age': len(closes) - i
                    })
            
            # Evaluate current price position relative to order blocks
            relevant_bullish = [b for b in bullish_blocks if b['price_level'] <= current_price * 1.02]
            relevant_bearish = [b for b in bearish_blocks if b['price_level'] >= current_price * 0.98]
            
            # Scoring based on order block presence and strength
            if relevant_bullish:
                strongest_bullish = max(relevant_bullish, key=lambda x: x['strength'])
                bullish_score = min(30, strongest_bullish['strength'] * 15)
                bullish_bias = "SMART_MONEY"
            else:
                bullish_score = 5
                bullish_bias = "INSTITUTIONAL_NEUTRAL"
                strongest_bullish = None
                
            if relevant_bearish:
                strongest_bearish = max(relevant_bearish, key=lambda x: x['strength'])
                bearish_score = min(25, strongest_bearish['strength'] * 12)
                bearish_bias = "SMART_MONEY"
            else:
                bearish_score = 5
                bearish_bias = "INSTITUTIONAL_NEUTRAL"
                strongest_bearish = None
            
            # Determine dominant order block bias
            if bullish_score > bearish_score + 10:
                score = bullish_score + 20  # Bonus for clear direction
                block_bias = "SMART_MONEY"
                block_direction = "BULLISH_BLOCKS"
            elif bearish_score > bullish_score + 10:
                score = bearish_score + 15
                block_bias = "SMART_MONEY"
                block_direction = "BEARISH_BLOCKS"
            else:
                score = max(bullish_score, bearish_score) + 5
                block_bias = "INSTITUTIONAL_NEUTRAL"
                block_direction = "MIXED_BLOCKS"
            
            details['order_blocks_analysis'] = {
                'bullish_blocks_count': len(relevant_bullish),
                'bearish_blocks_count': len(relevant_bearish),
                'strongest_bullish': strongest_bullish,
                'strongest_bearish': strongest_bearish,
                'dominant_direction': block_direction,
                'current_price': current_price,
                'bullish_score': bullish_score,
                'bearish_score': bearish_score
            }
            
            return InstitutionalConfirmation(
                name="Order Blocks",
                score=min(score, 100),
                bias=block_bias,
                details=details
            )
            
        except Exception as e:
            return InstitutionalConfirmation(
                name="Order Blocks",
                score=0,
                bias="INSTITUTIONAL_NEUTRAL",
                details={"error": str(e)}
            )
    
    def _evaluate_liquidity_grabs(
        self, 
        price_data: pd.DataFrame,
        volume_data: List[float]
    ) -> InstitutionalConfirmation:
        """🎯 Evaluar Liquidity Grabs - Manipulación institucional de liquidez"""
        try:
            score = 0
            details = {}
            
            if len(price_data) < 20:
                return InstitutionalConfirmation(
                    name="Liquidity Grabs",
                    score=10,
                    bias="INSTITUTIONAL_NEUTRAL",
                    details={"error": "Insufficient data for liquidity analysis"}
                )
            
            highs = price_data['high'].values
            lows = price_data['low'].values
            closes = price_data['close'].values
            volumes = np.array(volume_data[-len(closes):]) if len(volume_data) >= len(closes) else np.array(volume_data)
            
            # Detect Buy Side Liquidity Grabs (stop hunts above resistance)
            buy_side_grabs = 0
            for i in range(10, len(highs) - 2):
                # Find recent high
                local_high = max(highs[i-10:i])
                if (highs[i] > local_high * 1.001 and  # Break above high
                    volumes[i] > volumes[i-5:i].mean() * 1.3 and  # High volume
                    closes[i] < highs[i] * 0.995):  # But close below the break
                    buy_side_grabs += 1
            
            # Detect Sell Side Liquidity Grabs (stop hunts below support)  
            sell_side_grabs = 0
            for i in range(10, len(lows) - 2):
                # Find recent low
                local_low = min(lows[i-10:i])
                if (lows[i] < local_low * 0.999 and  # Break below low
                    volumes[i] > volumes[i-5:i].mean() * 1.3 and  # High volume
                    closes[i] > lows[i] * 1.005):  # But close above the break
                    sell_side_grabs += 1
            
            # Recent liquidity grab activity
            recent_buy_grabs = 0
            recent_sell_grabs = 0
            
            for i in range(max(0, len(highs) - 10), len(highs)):
                if i >= 10:
                    local_high = max(highs[i-10:i])
                    if (highs[i] > local_high * 1.001 and
                        volumes[i] > volumes[max(0, i-5):i].mean() * 1.2):
                        recent_buy_grabs += 1
                        
                    local_low = min(lows[i-10:i])  
                    if (lows[i] < local_low * 0.999 and
                        volumes[i] > volumes[max(0, i-5):i].mean() * 1.2):
                        recent_sell_grabs += 1
            
            # Scoring liquidity grab activity
            total_grabs = buy_side_grabs + sell_side_grabs
            recent_grabs = recent_buy_grabs + recent_sell_grabs
            
            if total_grabs >= 3:
                grab_score = 25 + min(15, total_grabs * 3)  # Institutional activity detected
                grab_bias = "SMART_MONEY"
            elif total_grabs >= 1:
                grab_score = 15 + total_grabs * 5
                grab_bias = "SMART_MONEY"
            else:
                grab_score = 10
                grab_bias = "INSTITUTIONAL_NEUTRAL"
            
            score += grab_score
            
            # Recent activity bonus
            if recent_grabs > 0:
                recent_score = 15 + recent_grabs * 8
                recent_bias = "SMART_MONEY"
                score += recent_score
            else:
                recent_score = 5
                recent_bias = "INSTITUTIONAL_NEUTRAL"
            
            # Determine liquidity grab direction bias
            if recent_buy_grabs > recent_sell_grabs:
                grab_direction = "BEARISH_LIQUIDITY_GRAB"  # Institutions hunting buy stops
                direction_implication = "Expect downward move after stop hunt"
            elif recent_sell_grabs > recent_buy_grabs:
                grab_direction = "BULLISH_LIQUIDITY_GRAB"  # Institutions hunting sell stops
                direction_implication = "Expect upward move after stop hunt"
            else:
                grab_direction = "MIXED_LIQUIDITY_ACTIVITY"
                direction_implication = "No clear directional bias"
            
            details['liquidity_grabs_analysis'] = {
                'total_buy_side_grabs': buy_side_grabs,
                'total_sell_side_grabs': sell_side_grabs,
                'recent_buy_grabs': recent_buy_grabs,
                'recent_sell_grabs': recent_sell_grabs,
                'grab_direction': grab_direction,
                'direction_implication': direction_implication,
                'institutional_activity_level': "HIGH" if total_grabs >= 3 else "MEDIUM" if total_grabs >= 1 else "LOW"
            }
            
            # Determine overall liquidity bias
            if score >= 50:
                bias = "SMART_MONEY"
            elif score >= 25:
                bias = "SMART_MONEY"
            else:
                bias = "INSTITUTIONAL_NEUTRAL"
                
            return InstitutionalConfirmation(
                name="Liquidity Grabs",
                score=min(score, 100),
                bias=bias,
                details=details
            )
            
        except Exception as e:
            return InstitutionalConfirmation(
                name="Liquidity Grabs",
                score=0,
                bias="INSTITUTIONAL_NEUTRAL",
                details={"error": str(e)}
            )
    
    def _evaluate_stop_hunting(
        self, 
        price_data: pd.DataFrame,
        volume_data: List[float]
    ) -> InstitutionalConfirmation:
        """🕳️ Evaluar Stop Hunting - Caza de stops institucional"""
        try:
            score = 0
            details = {}
            
            if len(price_data) < 15:
                return InstitutionalConfirmation(
                    name="Stop Hunting",
                    score=10,
                    bias="INSTITUTIONAL_NEUTRAL",
                    details={"error": "Insufficient data for stop hunting analysis"}
                )
            
            highs = price_data['high'].values
            lows = price_data['low'].values
            closes = price_data['close'].values
            opens = price_data['open'].values
            volumes = np.array(volume_data[-len(closes):]) if len(volume_data) >= len(closes) else np.array(volume_data)
            
            # Detect Stop Hunt Patterns (wicks that quickly reverse)
            stop_hunts_up = 0  # Upward stop hunts (hunt buy stops, then reverse down)
            stop_hunts_down = 0  # Downward stop hunts (hunt sell stops, then reverse up)
            
            for i in range(5, len(highs) - 1):
                # Upward Stop Hunt Pattern
                wick_size_up = highs[i] - max(opens[i], closes[i])
                body_size = abs(closes[i] - opens[i])
                
                if (wick_size_up > body_size * 2 and  # Long upper wick
                    highs[i] > max(highs[i-5:i]) and  # New high
                    volumes[i] > volumes[i-3:i].mean() * 1.5 and  # High volume
                    closes[i+1] < closes[i] * 0.98):  # Reversal next candle
                    stop_hunts_up += 1
                
                # Downward Stop Hunt Pattern
                wick_size_down = min(opens[i], closes[i]) - lows[i]
                
                if (wick_size_down > body_size * 2 and  # Long lower wick
                    lows[i] < min(lows[i-5:i]) and  # New low
                    volumes[i] > volumes[i-3:i].mean() * 1.5 and  # High volume
                    closes[i+1] > closes[i] * 1.02):  # Reversal next candle
                    stop_hunts_down += 1
            
            # Recent stop hunting activity (last 10 candles)
            recent_hunts_up = 0
            recent_hunts_down = 0
            
            start_idx = max(5, len(highs) - 10)
            for i in range(start_idx, len(highs) - 1):
                wick_up = highs[i] - max(opens[i], closes[i])
                wick_down = min(opens[i], closes[i]) - lows[i]
                body = abs(closes[i] - opens[i])
                
                if wick_up > body * 1.5 and highs[i] > max(highs[max(0, i-5):i]):
                    recent_hunts_up += 1
                if wick_down > body * 1.5 and lows[i] < min(lows[max(0, i-5):i]):
                    recent_hunts_down += 1
            
            # Scoring stop hunting activity
            total_hunts = stop_hunts_up + stop_hunts_down
            recent_hunts = recent_hunts_up + recent_hunts_down
            
            if total_hunts >= 2:
                hunt_score = 20 + min(20, total_hunts * 5)
                hunt_bias = "SMART_MONEY"
                activity_level = "HIGH" if total_hunts >= 4 else "MEDIUM"
            elif total_hunts >= 1:
                hunt_score = 15 + total_hunts * 8
                hunt_bias = "SMART_MONEY"
                activity_level = "MEDIUM"
            else:
                hunt_score = 8
                hunt_bias = "INSTITUTIONAL_NEUTRAL"
                activity_level = "LOW"
            
            score += hunt_score
            
            # Recent activity scoring
            if recent_hunts > 0:
                recent_score = 15 + recent_hunts * 10
                score += recent_score
                recent_activity = "ACTIVE"
            else:
                recent_score = 5
                recent_activity = "INACTIVE"
            
            # Determine hunting direction and implications
            if recent_hunts_down > recent_hunts_up:
                hunt_direction = "BULLISH_SETUP"  # Hunting sell stops = bullish setup
                direction_bias = "SMART_MONEY"
                implication = "Institutions clearing sell stops before upward move"
            elif recent_hunts_up > recent_hunts_down:
                hunt_direction = "BEARISH_SETUP"  # Hunting buy stops = bearish setup
                direction_bias = "SMART_MONEY"
                implication = "Institutions clearing buy stops before downward move"
            else:
                hunt_direction = "MIXED_HUNTING"
                direction_bias = "INSTITUTIONAL_NEUTRAL"
                implication = "No clear directional hunting pattern"
            
            details['stop_hunting_analysis'] = {
                'total_upward_hunts': stop_hunts_up,
                'total_downward_hunts': stop_hunts_down,
                'recent_upward_hunts': recent_hunts_up,
                'recent_downward_hunts': recent_hunts_down,
                'hunt_direction': hunt_direction,
                'activity_level': activity_level,
                'recent_activity': recent_activity,
                'institutional_implication': implication
            }
            
            # Determine overall stop hunting bias
            if score >= 50:
                bias = "SMART_MONEY"
            elif score >= 25:
                bias = "SMART_MONEY"
            else:
                bias = "INSTITUTIONAL_NEUTRAL"
                
            return InstitutionalConfirmation(
                name="Stop Hunting",
                score=min(score, 100),
                bias=bias,
                details=details
            )
            
        except Exception as e:
            return InstitutionalConfirmation(
                name="Stop Hunting",
                score=0,
                bias="INSTITUTIONAL_NEUTRAL",
                details={"error": str(e)}
            )
    
    def _evaluate_fair_value_gaps(
        self, 
        price_data: pd.DataFrame
    ) -> InstitutionalConfirmation:
        """⚡ Evaluar Fair Value Gaps - Zonas de ineficiencia del mercado"""
        try:
            score = 0
            details = {}
            
            if len(price_data) < 10:
                return InstitutionalConfirmation(
                    name="Fair Value Gaps",
                    score=10,
                    bias="INSTITUTIONAL_NEUTRAL",
                    details={"error": "Insufficient data for FVG analysis"}
                )
            
            highs = price_data['high'].values
            lows = price_data['low'].values
            closes = price_data['close'].values
            current_price = closes[-1]
            
            # Detect Bullish Fair Value Gaps
            bullish_fvgs = []
            for i in range(1, len(highs) - 1):
                # Bullish FVG: Gap between candle[i-1].high and candle[i+1].low
                if lows[i+1] > highs[i-1]:
                    gap_size = lows[i+1] - highs[i-1]
                    gap_percentage = gap_size / highs[i-1] * 100
                    
                    bullish_fvgs.append({
                        'gap_low': highs[i-1],
                        'gap_high': lows[i+1],
                        'gap_size': gap_size,
                        'gap_percentage': gap_percentage,
                        'candle_index': i,
                        'age': len(highs) - i - 1,
                        'filled': current_price < highs[i-1]  # Has price returned to fill gap?
                    })
            
            # Detect Bearish Fair Value Gaps
            bearish_fvgs = []
            for i in range(1, len(lows) - 1):
                # Bearish FVG: Gap between candle[i-1].low and candle[i+1].high
                if highs[i+1] < lows[i-1]:
                    gap_size = lows[i-1] - highs[i+1]
                    gap_percentage = gap_size / lows[i-1] * 100
                    
                    bearish_fvgs.append({
                        'gap_low': highs[i+1],
                        'gap_high': lows[i-1], 
                        'gap_size': gap_size,
                        'gap_percentage': gap_percentage,
                        'candle_index': i,
                        'age': len(lows) - i - 1,
                        'filled': current_price > lows[i-1]  # Has price returned to fill gap?
                    })
            
            # Filter significant gaps (> 0.1% for crypto)
            significant_bullish = [fvg for fvg in bullish_fvgs if fvg['gap_percentage'] > 0.1]
            significant_bearish = [fvg for fvg in bearish_fvgs if fvg['gap_percentage'] > 0.1]
            
            # Find unfilled gaps near current price
            nearby_bullish = [fvg for fvg in significant_bullish 
                            if not fvg['filled'] and fvg['gap_low'] <= current_price * 1.05]
            nearby_bearish = [fvg for fvg in significant_bearish 
                            if not fvg['filled'] and fvg['gap_high'] >= current_price * 0.95]
            
            # Scoring based on FVG presence and characteristics
            if nearby_bullish:
                largest_bullish = max(nearby_bullish, key=lambda x: x['gap_percentage'])
                bullish_score = min(35, len(nearby_bullish) * 10 + largest_bullish['gap_percentage'] * 2)
                bullish_quality = "HIGH" if largest_bullish['gap_percentage'] > 0.5 else "MEDIUM"
            else:
                bullish_score = 5
                bullish_quality = "LOW"
                largest_bullish = None
            
            if nearby_bearish:
                largest_bearish = max(nearby_bearish, key=lambda x: x['gap_percentage'])
                bearish_score = min(30, len(nearby_bearish) * 8 + largest_bearish['gap_percentage'] * 2)
                bearish_quality = "HIGH" if largest_bearish['gap_percentage'] > 0.5 else "MEDIUM"
            else:
                bearish_score = 5
                bearish_quality = "LOW"
                largest_bearish = None
            
            # Determine dominant FVG bias
            if bullish_score > bearish_score + 10:
                score = bullish_score + 15  # Bonus for clear direction
                fvg_bias = "SMART_MONEY"
                fvg_direction = "BULLISH_GAPS"
                expectation = "Price likely to respect bullish FVG levels as support"
            elif bearish_score > bullish_score + 10:
                score = bearish_score + 12
                fvg_bias = "SMART_MONEY"
                fvg_direction = "BEARISH_GAPS"
                expectation = "Price likely to respect bearish FVG levels as resistance"
            else:
                score = max(bullish_score, bearish_score) + 5
                fvg_bias = "INSTITUTIONAL_NEUTRAL"
                fvg_direction = "MIXED_GAPS"
                expectation = "Mixed FVG signals - watch for gap fills"
            
            details['fvg_analysis'] = {
                'total_bullish_fvgs': len(significant_bullish),
                'total_bearish_fvgs': len(significant_bearish),
                'nearby_bullish_fvgs': len(nearby_bullish),
                'nearby_bearish_fvgs': len(nearby_bearish),
                'largest_bullish_gap': largest_bullish,
                'largest_bearish_gap': largest_bearish,
                'dominant_direction': fvg_direction,
                'market_expectation': expectation,
                'current_price': current_price
            }
            
            return InstitutionalConfirmation(
                name="Fair Value Gaps",
                score=min(score, 100),
                bias=fvg_bias,
                details=details
            )
            
        except Exception as e:
            return InstitutionalConfirmation(
                name="Fair Value Gaps",
                score=0,
                bias="INSTITUTIONAL_NEUTRAL",
                details={"error": str(e)}
            )
    
    def _evaluate_market_microstructure(
        self, 
        price_data: pd.DataFrame,
        volume_data: List[float]
    ) -> InstitutionalConfirmation:
        """🔬 Evaluar Market Microstructure - Estructura interna del mercado"""
        try:
            score = 0
            details = {}
            
            if len(price_data) < 20:
                return InstitutionalConfirmation(
                    name="Market Microstructure",
                    score=15,
                    bias="INSTITUTIONAL_NEUTRAL",
                    details={"error": "Insufficient data for microstructure analysis"}
                )
            
            highs = price_data['high'].values
            lows = price_data['low'].values
            closes = price_data['close'].values
            opens = price_data['open'].values
            volumes = np.array(volume_data[-len(closes):]) if len(volume_data) >= len(closes) else np.array(volume_data)
            
            # 1. Market Structure Analysis (Higher Highs/Lower Lows)
            recent_highs = highs[-10:]
            recent_lows = lows[-10:]
            
            # Check for structural patterns
            higher_highs = 0
            lower_lows = 0
            
            for i in range(1, len(recent_highs)):
                if recent_highs[i] > recent_highs[i-1]:
                    higher_highs += 1
                    
            for i in range(1, len(recent_lows)):
                if recent_lows[i] < recent_lows[i-1]:
                    lower_lows += 1
            
            # Structure scoring
            if higher_highs >= 6 and lower_lows <= 3:  # Strong uptrend structure
                structure_score = 30
                structure_bias = "SMART_MONEY"
                structure_type = "BULLISH_STRUCTURE"
            elif lower_lows >= 6 and higher_highs <= 3:  # Strong downtrend structure
                structure_score = 25
                structure_bias = "SMART_MONEY"
                structure_type = "BEARISH_STRUCTURE"
            elif higher_highs >= 4 or lower_lows >= 4:  # Moderate structure
                structure_score = 20
                structure_bias = "SMART_MONEY"
                structure_type = "DEVELOPING_STRUCTURE"
            else:  # Ranging/choppy structure
                structure_score = 10
                structure_bias = "INSTITUTIONAL_NEUTRAL"
                structure_type = "RANGING_STRUCTURE"
            
            score += structure_score
            
            # 2. Volume Profile Analysis (simplified)
            # Find areas of high volume concentration
            price_levels = {}
            for i, close in enumerate(closes[-20:]):  # Last 20 candles
                price_bucket = round(close, -2)  # Round to nearest 100 for grouping
                if price_bucket in price_levels:
                    price_levels[price_bucket] += volumes[-(20-i)] if i < len(volumes) else 0
                else:
                    price_levels[price_bucket] = volumes[-(20-i)] if i < len(volumes) else 0
            
            if price_levels:
                max_volume_price = max(price_levels.keys(), key=lambda k: price_levels[k])
                total_volume = sum(price_levels.values())
                max_volume_ratio = price_levels[max_volume_price] / total_volume if total_volume > 0 else 0
                
                # Volume concentration scoring
                if max_volume_ratio > 0.3:  # High concentration
                    volume_score = 25
                    volume_bias = "SMART_MONEY"
                    volume_quality = "HIGH_CONCENTRATION"
                elif max_volume_ratio > 0.2:  # Medium concentration
                    volume_score = 20
                    volume_bias = "SMART_MONEY"
                    volume_quality = "MEDIUM_CONCENTRATION"
                else:  # Distributed volume
                    volume_score = 15
                    volume_bias = "INSTITUTIONAL_NEUTRAL"
                    volume_quality = "DISTRIBUTED_VOLUME"
            else:
                max_volume_price = closes[-1]
                max_volume_ratio = 0
                volume_score = 10
                volume_bias = "INSTITUTIONAL_NEUTRAL"
                volume_quality = "INSUFFICIENT_DATA"
            
            score += volume_score
            
            # 3. Order Flow Approximation (based on candle bodies vs wicks)
            bullish_pressure = 0
            bearish_pressure = 0
            
            for i in range(-10, 0):  # Last 10 candles
                if i < -len(opens):
                    continue
                    
                body_size = abs(closes[i] - opens[i])
                upper_wick = highs[i] - max(opens[i], closes[i])
                lower_wick = min(opens[i], closes[i]) - lows[i]
                
                if closes[i] > opens[i]:  # Bullish candle
                    bullish_pressure += body_size - upper_wick * 0.5  # Body power minus rejection
                else:  # Bearish candle
                    bearish_pressure += body_size - lower_wick * 0.5  # Body power minus rejection
            
            # Order flow scoring
            if bullish_pressure > bearish_pressure * 1.5:
                flow_score = 25
                flow_bias = "SMART_MONEY"
                flow_direction = "BULLISH_FLOW"
            elif bearish_pressure > bullish_pressure * 1.5:
                flow_score = 20
                flow_bias = "SMART_MONEY"
                flow_direction = "BEARISH_FLOW"
            else:
                flow_score = 12
                flow_bias = "INSTITUTIONAL_NEUTRAL"
                flow_direction = "BALANCED_FLOW"
            
            score += flow_score
            
            details['microstructure_analysis'] = {
                'structure_type': structure_type,
                'higher_highs_count': higher_highs,
                'lower_lows_count': lower_lows,
                'volume_concentration': volume_quality,
                'max_volume_price_level': max_volume_price,
                'volume_concentration_ratio': max_volume_ratio,
                'order_flow_direction': flow_direction,
                'bullish_pressure': bullish_pressure,
                'bearish_pressure': bearish_pressure,
                'structure_score': structure_score,
                'volume_score': volume_score,
                'flow_score': flow_score
            }
            
            # Determine overall microstructure bias
            if score >= 60:
                bias = "SMART_MONEY"
            elif score >= 40:
                bias = "SMART_MONEY"
            else:
                bias = "INSTITUTIONAL_NEUTRAL"
                
            return InstitutionalConfirmation(
                name="Market Microstructure",
                score=min(score, 100),
                bias=bias,
                details=details
            )
            
        except Exception as e:
            return InstitutionalConfirmation(
                name="Market Microstructure",
                score=0,
                bias="INSTITUTIONAL_NEUTRAL",
                details={"error": str(e)}
            )
    
    def _calculate_institutional_quality(
        self, 
        confirmations: Dict[str, InstitutionalConfirmation]
    ) -> tuple[float, str, str]:
        """Calcular calidad institucional y recomendación Smart Money"""
        
        # Weights for institutional confirmations
        weights = {
            "wyckoff_method": 0.25,          # Highest weight - core institutional
            "market_microstructure": 0.20,   # Second highest - structure analysis
            "order_blocks": 0.20,           # Important institutional zones
            "liquidity_grabs": 0.15,        # Manipulation detection
            "stop_hunting": 0.10,           # Hunt patterns
            "fair_value_gaps": 0.10         # Gap analysis
        }
        
        total_score = 0
        smart_money_signals = 0
        retail_trap_signals = 0
        neutral_signals = 0
        
        for name, confirmation in confirmations.items():
            weight = weights.get(name, 0.15)
            total_score += confirmation.score * weight
            
            if confirmation.bias == "SMART_MONEY":
                smart_money_signals += 1
            elif confirmation.bias == "RETAIL_TRAP":
                retail_trap_signals += 1
            else:
                neutral_signals += 1
        
        # Determine institutional confidence level
        if total_score >= self.institutional_thresholds["INSTITUTIONAL"]:
            confidence_level = "INSTITUTIONAL"
        elif total_score >= self.institutional_thresholds["HIGH"]:
            confidence_level = "HIGH"
        elif total_score >= self.institutional_thresholds["MEDIUM"]:
            confidence_level = "MEDIUM"
        else:
            confidence_level = "LOW"
        
        # Determine Smart Money recommendation
        if smart_money_signals >= 4 and total_score >= 80:
            recommendation = "INSTITUTIONAL_BUY"
        elif smart_money_signals >= 3 and total_score >= 65:
            recommendation = "ACCUMULATION"
        elif retail_trap_signals >= 3 or total_score < 35:
            recommendation = "DISTRIBUTION"  # or avoid
        elif smart_money_signals >= 2 and total_score >= 50:
            recommendation = "INSTITUTIONAL_SELL"
        else:
            recommendation = "WAIT"
        
        return total_score, confidence_level, recommendation
    
    def _identify_manipulation_alerts(
        self, 
        confirmations: Dict[str, InstitutionalConfirmation]
    ) -> List[str]:
        """Identificar alertas específicas de manipulación institucional"""
        alerts = []
        
        for name, confirmation in confirmations.items():
            if confirmation.score < 25:  # Low institutional quality
                alerts.append(f"Low {name} institutional signal: {confirmation.score:.1f}")
            
            if confirmation.bias == "RETAIL_TRAP":
                alerts.append(f"{name.title()} indicates potential retail trap")
            
            # Specific manipulation alerts from details
            if hasattr(confirmation, 'details') and confirmation.details:
                if name == "liquidity_grabs":
                    details = confirmation.details.get('liquidity_grabs_analysis', {})
                    if details.get('institutional_activity_level') == "HIGH":
                        alerts.append("High liquidity grab activity detected - institutional manipulation likely")
                
                elif name == "stop_hunting":
                    details = confirmation.details.get('stop_hunting_analysis', {})
                    if details.get('recent_activity') == "ACTIVE":
                        alerts.append("Recent stop hunting detected - expect reversal after hunt completion")
                
                elif name == "wyckoff_method":
                    details = confirmation.details.get('price_volume_divergence', {})
                    if details.get('divergence_type') in ["ACCUMULATION_DIVERGENCE", "DISTRIBUTION_DIVERGENCE"]:
                        alerts.append(f"Wyckoff {details.get('divergence_type')} pattern detected")
        
        return alerts

    def get_institutional_summary(self, quality: InstitutionalSignalQuality) -> str:
        """Generar resumen textual de la evaluación INSTITUCIONAL"""
        summary = f"🏛️ Institutional Signal Quality: {quality.confidence_level} ({quality.overall_score:.1f}/100)\n"
        summary += f"Smart Money Recommendation: {quality.smart_money_recommendation}\n"
        
        if quality.institutional_confirmations:
            summary += "\nInstitutional Confirmations:\n"
            for name, confirmation in quality.institutional_confirmations.items():
                summary += f"  • {confirmation.name}: {confirmation.bias} ({confirmation.score:.1f})\n"
        
        if quality.manipulation_alerts:
            summary += f"\nManipulation Alerts ({len(quality.manipulation_alerts)}):\n"
            for alert in quality.manipulation_alerts[:3]:  # Top 3 alerts
                summary += f"  • {alert}\n"
        
        return summary