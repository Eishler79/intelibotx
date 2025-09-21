#!/usr/bin/env python3
"""
🏛️ InstitutionalDetector - Detección real de actividad institucional
SPEC_REF: SMART_SCALPER_STRATEGY.md#institutional-detection
"""

from typing import List, Dict
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

class ManipulationType(Enum):
    NONE = "none"
    STOP_HUNT = "stop_hunt"
    LIQUIDITY_GRAB = "liquidity_grab"

class MarketPhase(Enum):
    ACCUMULATION = "accumulation"
    DISTRIBUTION = "distribution"
    MARKUP = "markup"
    MARKDOWN = "markdown"

@dataclass
class InstitutionalAnalysis:
    symbol: str
    timeframe: str
    timestamp: str
    manipulation_type: ManipulationType
    market_phase: MarketPhase
    order_blocks: List[Dict]
    manipulation_events: List[Dict]
    active_manipulations: List[Dict]
    manipulation_risk: float
    wyckoff_signals: List[Dict]
    accumulation_distribution_line: float
    market_structure_break: bool
    change_of_character: bool
    fair_value_gaps: List[Dict]
    liquidity_sweep_detected: bool
    large_player_activity: float
    retail_sentiment_score: float
    smart_money_flow: str
    trade_safety_score: float
    recommended_action: str

class InstitutionalDetector:
    def analyze_institutional_activity(self, symbol: str, timeframe: str,
                                     opens: List[float], highs: List[float], 
                                     lows: List[float], closes: List[float],
                                     volumes: List[float]) -> InstitutionalAnalysis:
        """Detectar actividad institucional real"""
        
        timestamp = datetime.utcnow().isoformat()

        manipulation = self._detect_manipulation(highs, lows, volumes)
        phase = self._analyze_market_phase(closes, volumes)
        order_blocks = self._find_order_blocks(opens, closes, volumes)
        events = self._detect_events(highs, lows, volumes)

        active_manipulations = []
        if manipulation != ManipulationType.NONE:
            active_manipulations.append({
                "type": manipulation.value,
                "strength": 0.6 if manipulation == ManipulationType.STOP_HUNT else 0.5
            })

        calculated_risk = self._calculate_manipulation_risk(events, active_manipulations)

        wyckoff_signals = self._build_wyckoff_signals(phase, closes, volumes)
        ad_line = self._accumulation_distribution_line(highs, lows, closes, volumes)
        market_structure_break = self._detect_structure_break(highs, lows)
        change_of_character = self._detect_change_of_character(closes)
        fair_value_gaps = self._identify_fair_value_gaps(highs, lows)
        liquidity_sweep_detected = any(evt.get("type") == "fake_breakout" for evt in events)
        large_player_activity = self._estimate_large_player_activity(volumes)
        retail_sentiment_score = max(0.0, min(1.0, 1 - large_player_activity))
        smart_money_flow = self._determine_smart_money_flow(phase, large_player_activity)
        trade_safety_score = max(0.0, 1 - calculated_risk)
        recommended_action = self._recommend_action(phase, calculated_risk)

        return InstitutionalAnalysis(
            symbol=symbol,
            timeframe=timeframe,
            timestamp=timestamp,
            manipulation_type=manipulation,
            market_phase=phase,
            order_blocks=order_blocks,
            manipulation_events=events,
            active_manipulations=active_manipulations,
            manipulation_risk=calculated_risk,
            wyckoff_signals=wyckoff_signals,
            accumulation_distribution_line=ad_line,
            market_structure_break=market_structure_break,
            change_of_character=change_of_character,
            fair_value_gaps=fair_value_gaps,
            liquidity_sweep_detected=liquidity_sweep_detected,
            large_player_activity=large_player_activity,
            retail_sentiment_score=retail_sentiment_score,
            smart_money_flow=smart_money_flow,
            trade_safety_score=trade_safety_score,
            recommended_action=recommended_action
        )
    
    def _detect_manipulation(self, highs: List[float], lows: List[float], 
                           volumes: List[float]) -> ManipulationType:
        """Detectar manipulación basada en price action real"""
        if len(highs) < 5:
            return ManipulationType.NONE
            
        # Volume spike + reversal = manipulation
        for i in range(2, len(volumes) - 1):
            avg_vol = sum(volumes[i-2:i+1]) / 3
            if volumes[i] > avg_vol * 2:
                if i < len(highs) - 1:
                    if highs[i] > highs[i-1] and highs[i+1] < highs[i] * 0.999:
                        return ManipulationType.STOP_HUNT
                        
        return ManipulationType.NONE
    
    def _analyze_market_phase(self, closes: List[float], volumes: List[float]) -> MarketPhase:
        """Análisis Wyckoff usando datos reales"""
        if len(closes) < 10:
            return MarketPhase.ACCUMULATION
            
        # Price trend + volume analysis
        price_trend = (closes[-1] - closes[-10]) / closes[-10]
        avg_volume = sum(volumes[-10:]) / 10
        recent_volume = sum(volumes[-3:]) / 3
        
        volume_increasing = recent_volume > avg_volume * 1.2
        
        if price_trend > 0.02 and volume_increasing:
            return MarketPhase.MARKUP
        elif price_trend < -0.02 and volume_increasing:
            return MarketPhase.MARKDOWN
        elif volume_increasing:
            return MarketPhase.ACCUMULATION
        else:
            return MarketPhase.DISTRIBUTION
    
    def _find_order_blocks(self, opens: List[float], closes: List[float], 
                          volumes: List[float]) -> List[Dict]:
        """Identificar order blocks reales"""
        blocks = []
        
        for i in range(1, len(closes)):
            # Strong move with volume
            move = abs(closes[i] - opens[i]) / opens[i]
            if move > 0.005 and i < len(volumes) and volumes[i] > 0:
                blocks.append({
                    "price": (opens[i] + closes[i]) / 2,
                    "strength": move * volumes[i],
                    "type": "bullish" if closes[i] > opens[i] else "bearish"
                })
                
        return sorted(blocks, key=lambda x: x["strength"], reverse=True)[:3]
    
    def _detect_events(self, highs: List[float], lows: List[float], 
                      volumes: List[float]) -> List[Dict]:
        """Detectar eventos de manipulación"""
        events = []
        
        for i in range(5, len(highs)):
            # Breakout + immediate reversal
            if highs[i] > max(highs[i-5:i]):
                if i < len(highs) - 1 and highs[i+1] < highs[i] * 0.998:
                    events.append({
                        "type": "fake_breakout",
                        "price": highs[i],
                        "direction": "up"
                    })
                    
        return events[-5:]  # Last 5 events

    def _build_wyckoff_signals(self, phase: MarketPhase, closes: List[float], volumes: List[float]) -> List[Dict]:
        if not closes or not volumes:
            return []

        lookback = min(len(closes), 20)
        recent_closes = closes[-lookback:]
        price_change = (recent_closes[-1] - recent_closes[0]) / recent_closes[0] if recent_closes[0] else 0.0
        volume_change = 0.0
        if len(volumes) >= lookback:
            recent_volumes = volumes[-lookback:]
            volume_change = (recent_volumes[-1] - recent_volumes[0]) / (recent_volumes[0] or 1)

        score = max(0.0, min(1.0, abs(price_change) * 4))
        return [{
            "phase": phase.value,
            "price_change": price_change,
            "volume_change": volume_change,
            "score": round(score, 3)
        }]

    def _accumulation_distribution_line(self, highs: List[float], lows: List[float],
                                        closes: List[float], volumes: List[float]) -> float:
        ad_line = 0.0
        for high, low, close, volume in zip(highs, lows, closes, volumes):
            if high == low:
                continue
            mfm = ((close - low) - (high - close)) / (high - low)
            ad_line += mfm * volume
        return ad_line

    def _detect_structure_break(self, highs: List[float], lows: List[float]) -> bool:
        if len(highs) < 5 or len(lows) < 5:
            return False
        recent_high = max(highs[-5:-1])
        recent_low = min(lows[-5:-1])
        return highs[-1] > recent_high * 1.002 or lows[-1] < recent_low * 0.998

    def _detect_change_of_character(self, closes: List[float]) -> bool:
        if len(closes) < 6:
            return False
        first_leg = closes[-4] - closes[-6]
        second_leg = closes[-1] - closes[-3]
        return (first_leg >= 0 and second_leg < 0) or (first_leg <= 0 and second_leg > 0)

    def _identify_fair_value_gaps(self, highs: List[float], lows: List[float]) -> List[Dict]:
        gaps = []
        for i in range(1, len(highs)):
            gap_up = lows[i] > highs[i-1] * 1.0005
            gap_down = highs[i] < lows[i-1] * 0.9995
            if gap_up:
                gaps.append({
                    "type": "bullish",
                    "gap_low": highs[i-1],
                    "gap_high": lows[i],
                    "size": lows[i] - highs[i-1]
                })
            elif gap_down:
                gaps.append({
                    "type": "bearish",
                    "gap_low": highs[i],
                    "gap_high": lows[i-1],
                    "size": lows[i-1] - highs[i]
                })
        return gaps[-5:]

    def _estimate_large_player_activity(self, volumes: List[float]) -> float:
        if not volumes:
            return 0.0
        avg_volume = sum(volumes) / len(volumes)
        threshold = avg_volume * 1.8
        large_trades = sum(1 for v in volumes if v >= threshold)
        return min(1.0, large_trades / max(len(volumes), 1))

    def _determine_smart_money_flow(self, phase: MarketPhase, large_player_activity: float) -> str:
        if large_player_activity < 0.1:
            return "NEUTRAL"
        if phase in (MarketPhase.ACCUMULATION, MarketPhase.MARKUP):
            return "INFLOW"
        if phase in (MarketPhase.DISTRIBUTION, MarketPhase.MARKDOWN):
            return "OUTFLOW"
        return "NEUTRAL"

    def _recommend_action(self, phase: MarketPhase, manipulation_risk: float) -> str:
        if manipulation_risk > 0.6:
            return "CAUTION"
        if phase in (MarketPhase.ACCUMULATION, MarketPhase.MARKUP):
            return "FOLLOW"
        if phase in (MarketPhase.DISTRIBUTION, MarketPhase.MARKDOWN):
            return "AVOID"
        return "NEUTRAL"
    
    def _calculate_manipulation_risk(self, manipulation_events: List[Dict], 
                                   active_manipulations: List[Dict]) -> float:
        """
        Calculate manipulation risk score from 0.0 to 1.0
        
        Args:
            manipulation_events: List of detected manipulation events
            active_manipulations: List of currently active manipulations
            
        Returns:
            float: Risk score between 0.0 (low risk) and 1.0 (high risk)
        """
        try:
            # Validate input parameters
            if manipulation_events is None:
                manipulation_events = []
            if active_manipulations is None:
                active_manipulations = []
                
            # Ensure inputs are lists
            if not isinstance(manipulation_events, list):
                manipulation_events = []
            if not isinstance(active_manipulations, list):
                active_manipulations = []
            
            # Base risk from active manipulations
            base_risk = len(active_manipulations) * 0.3
            
            # Risk from recent manipulation events  
            event_risk = len(manipulation_events) * 0.1
            
            # Cap at 1.0 maximum risk
            total_risk = min(1.0, max(0.0, base_risk + event_risk))
            
            return total_risk
            
        except Exception as e:
            # Fallback to safe default if calculation fails
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"⚠️ manipulation_risk calculation failed: {e}, using default 0.0")
            return 0.0
