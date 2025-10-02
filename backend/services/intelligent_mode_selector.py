#!/usr/bin/env python3
"""
🎯 IntelligentModeSelector - Mode Selection IA for Smart Trading
DL-109: Mode Selection → Algorithm Integration Implementation

This service implements the Mode Selection phase that runs BEFORE Algorithm Selection,
providing intelligent mode decision based on market analysis.

Eduard Guzmán - InteliBotX - DL-109 Implementation
"""

from typing import Dict, Optional
from enum import Enum
import logging

from services.market_microstructure_analyzer import MarketMicrostructure
from services.institutional_detector import InstitutionalAnalysis, MarketPhase, ManipulationType
from services.multi_timeframe_coordinator import MultiTimeframeSignal, TimeframeAlignment, TrendStrength, TimeframeData

logger = logging.getLogger(__name__)

class TradingMode(Enum):
    """Available trading modes for the intelligent bot"""
    SCALPING = "SCALPING"
    TREND_FOLLOWING = "TREND_FOLLOWING"
    ANTI_MANIPULATION = "ANTI_MANIPULATION"
    NEWS_SENTIMENT = "NEWS_SENTIMENT"
    VOLATILITY_ADAPTIVE = "VOLATILITY_ADAPTIVE"

class IntelligentModeSelector:
    """
    DL-109 Implementation: Mode Selection → Algorithm Integration

    Selects optimal trading mode based on real market conditions
    BEFORE algorithm selection to ensure coherent mode-algorithm alignment
    """

    def __init__(self):
        """Initialize mode selector with scoring weights"""
        self.mode_weights = self._initialize_mode_weights()
        logger.info("🎯 IntelligentModeSelector initialized (DL-109 compliant)")

    def _initialize_mode_weights(self) -> Dict:
        """Initialize mode selection weights based on market conditions"""
        return {
            "volatility_threshold_high": 0.02,  # >2% volatility
            "manipulation_risk_threshold": 0.6,  # 60% manipulation risk
            "trend_strength_threshold": 0.7,    # 70% trend strength
            "volume_anomaly_threshold": 0.5,    # 50% volume anomaly
            "institutional_confidence": 0.65    # 65% institutional confidence
        }

    def select_optimal_mode(self,
                          microstructure: Optional[MarketMicrostructure],
                          institutional: Optional[InstitutionalAnalysis],
                          multi_tf: Optional[MultiTimeframeSignal],
                          timeframe_data: Dict[str, TimeframeData],
                          symbol: str) -> str:
        """
        DL-109: Select optimal trading mode based on market analysis

        Execution order: Mode Selection FIRST → Algorithm Selection after

        Args:
            microstructure: Market microstructure analysis
            institutional: Institutional activity analysis
            multi_tf: Multi-timeframe signal analysis
            timeframe_data: Data for all timeframes
            symbol: Trading symbol

        Returns:
            Selected mode as string (SCALPING, TREND_FOLLOWING, etc.)
        """
        try:
            # Calculate mode scores
            mode_scores = {}

            # 1. ANTI_MANIPULATION Mode Detection
            manipulation_score = self._calculate_manipulation_mode_score(institutional, microstructure)
            mode_scores[TradingMode.ANTI_MANIPULATION] = manipulation_score

            # 2. TREND_FOLLOWING Mode Detection
            trend_score = self._calculate_trend_mode_score(multi_tf, institutional)
            mode_scores[TradingMode.TREND_FOLLOWING] = trend_score

            # 3. SCALPING Mode Detection
            scalping_score = self._calculate_scalping_mode_score(microstructure, multi_tf)
            mode_scores[TradingMode.SCALPING] = scalping_score

            # 4. VOLATILITY_ADAPTIVE Mode Detection
            volatility_score = self._calculate_volatility_mode_score(microstructure, timeframe_data)
            mode_scores[TradingMode.VOLATILITY_ADAPTIVE] = volatility_score

            # 5. NEWS_SENTIMENT Mode Detection (default low score for now)
            news_score = self._calculate_news_mode_score(institutional, symbol)
            mode_scores[TradingMode.NEWS_SENTIMENT] = news_score

            # Select mode with highest score
            best_mode = max(mode_scores, key=mode_scores.get)
            best_score = mode_scores[best_mode]

            logger.info(f"🎯 Mode Selection: {best_mode.value} (score: {best_score:.3f})")
            logger.info(f"   All scores: {[(mode.value, score) for mode, score in mode_scores.items()]}")

            # MODES_OVERVIEW.md compliance: Score < 60 → Default Scalping Mode
            # Only SCALPING mode is fully implemented (6/6 algorithms)
            if best_score < 0.6:
                logger.info(f"⚠️ Low confidence ({best_score:.3f}) → Fallback to SCALPING (default mode)")
                return TradingMode.SCALPING.value

            # MODE_SELECTION_CONCEPT.md: Only allow implemented modes
            # Until TREND_FOLLOWING is fully implemented, force SCALPING
            if best_mode != TradingMode.SCALPING:
                logger.warning(f"⚠️ {best_mode.value} not fully implemented → Using SCALPING (only complete mode)")
                return TradingMode.SCALPING.value

            return best_mode.value

        except Exception as e:
            logger.error(f"Error in mode selection: {e}")
            # Fallback to SCALPING mode
            return TradingMode.SCALPING.value

    def _calculate_manipulation_mode_score(self, institutional: Optional[InstitutionalAnalysis],
                                         microstructure: Optional[MarketMicrostructure]) -> float:
        """Calculate score for ANTI_MANIPULATION mode"""
        try:
            score = 0.0

            if institutional:
                # High manipulation events = high anti-manipulation mode score
                if institutional.manipulation_type != ManipulationType.NONE:
                    score += 0.4

                # High manipulation risk = prefer anti-manipulation mode
                if institutional.manipulation_risk > self.mode_weights["manipulation_risk_threshold"]:
                    score += 0.3

                # Distribution/Accumulation phases = manipulation likely
                if institutional.market_phase in [MarketPhase.DISTRIBUTION, MarketPhase.ACCUMULATION]:
                    score += 0.2

            if microstructure:
                # Volume anomalies = potential manipulation
                if microstructure.volume_anomaly_score > self.mode_weights["volume_anomaly_threshold"]:
                    score += 0.2

                # Low liquidity = manipulation easier
                if microstructure.liquidity_score < 0.5:
                    score += 0.1

            return min(1.0, score)

        except Exception as e:
            logger.error(f"Error calculating manipulation mode score: {e}")
            return 0.0

    def _calculate_trend_mode_score(self, multi_tf: Optional[MultiTimeframeSignal],
                                  institutional: Optional[InstitutionalAnalysis]) -> float:
        """Calculate score for TREND_FOLLOWING mode"""
        try:
            score = 0.0

            if multi_tf:
                # Strong trend alignment = high trend following score
                logger.info(f"   TREND DEBUG: trend_strength = {multi_tf.trend_strength}")
                if multi_tf.trend_strength == TrendStrength.STRONG:
                    score += 0.5
                elif multi_tf.trend_strength == TrendStrength.MODERATE:
                    score += 0.3

                # Clear directional alignment
                logger.info(f"   TREND DEBUG: alignment = {multi_tf.alignment}")
                if multi_tf.alignment in [TimeframeAlignment.BULLISH, TimeframeAlignment.BEARISH]:
                    score += 0.3

                # High confidence in trend
                logger.info(f"   TREND DEBUG: confidence = {multi_tf.confidence}")
                if multi_tf.confidence > self.mode_weights["trend_strength_threshold"]:
                    score += 0.2

            if institutional:
                # Markup/Markdown phases = trending market
                logger.info(f"   TREND DEBUG: market_phase = {institutional.market_phase}")
                if institutional.market_phase in [MarketPhase.MARKUP, MarketPhase.MARKDOWN]:
                    score += 0.2

            logger.info(f"   TREND FINAL SCORE: {score}")
            return min(1.0, score)

        except Exception as e:
            logger.error(f"Error calculating trend mode score: {e}")
            return 0.0

    def _calculate_scalping_mode_score(self, microstructure: Optional[MarketMicrostructure],
                                     multi_tf: Optional[MultiTimeframeSignal]) -> float:
        """Calculate score for SCALPING mode"""
        try:
            score = 0.3  # Base score for scalping (default mode)

            if microstructure:
                # High liquidity = good for scalping
                if microstructure.liquidity_score > 0.7:
                    score += 0.3

                # Low volume anomalies = stable for scalping
                if microstructure.volume_anomaly_score < 0.3:
                    score += 0.2

                # Balanced order flow = good scalping conditions
                if abs(microstructure.order_flow_imbalance) < 0.2:
                    score += 0.1

            if multi_tf:
                # Neutral/weak trends = good for scalping
                if multi_tf.alignment == TimeframeAlignment.NEUTRAL:
                    score += 0.2
                elif multi_tf.trend_strength == TrendStrength.WEAK:
                    score += 0.1

            return min(1.0, score)

        except Exception as e:
            logger.error(f"Error calculating scalping mode score: {e}")
            return 0.3  # Return base score

    def _calculate_volatility_mode_score(self, microstructure: Optional[MarketMicrostructure],
                                       timeframe_data: Dict[str, TimeframeData]) -> float:
        """Calculate score for VOLATILITY_ADAPTIVE mode"""
        try:
            score = 0.0

            # Calculate current volatility from timeframe data
            if timeframe_data:
                volatility_sum = 0
                count = 0

                for tf, data in timeframe_data.items():
                    if hasattr(data, 'atr') and data.atr > 0:
                        # Normalize ATR by current price
                        if hasattr(data, 'closes') and len(data.closes) > 0:
                            volatility_ratio = data.atr / data.closes[-1]
                            volatility_sum += volatility_ratio
                            count += 1

                if count > 0:
                    avg_volatility = volatility_sum / count

                    # High volatility = prefer volatility adaptive mode
                    if avg_volatility > self.mode_weights["volatility_threshold_high"]:
                        score += 0.6
                    elif avg_volatility > self.mode_weights["volatility_threshold_high"] * 0.5:
                        score += 0.3

            if microstructure:
                # High volume anomalies = volatile conditions
                if microstructure.volume_anomaly_score > 0.7:
                    score += 0.2

                # Extreme order flow imbalance = volatility
                if abs(microstructure.order_flow_imbalance) > 0.5:
                    score += 0.2

            return min(1.0, score)

        except Exception as e:
            logger.error(f"Error calculating volatility mode score: {e}")
            return 0.0

    def _calculate_news_mode_score(self, institutional: Optional[InstitutionalAnalysis],
                                 symbol: str) -> float:
        """Calculate score for NEWS_SENTIMENT mode"""
        try:
            score = 0.0

            # For now, basic implementation
            # TODO: Integrate real news sentiment analysis

            if institutional:
                # High institutional activity = might be news-driven
                if institutional.manipulation_risk < 0.3:  # Low manipulation = might be legitimate news
                    score += 0.1

            # Major pairs more likely to be news-driven
            major_pairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT"]
            if symbol in major_pairs:
                score += 0.1

            return min(1.0, score)

        except Exception as e:
            logger.error(f"Error calculating news mode score: {e}")
            return 0.0