#!/usr/bin/env python3
"""
🤖 AdvancedAlgorithmSelector - Selector Inteligente de Algoritmos ML-Based
Selección automática del mejor algoritmo basado en condiciones de mercado
usando técnicas de Machine Learning y scoring avanzado

Eduard Guzmán - InteliBotX - Smart Scalper Pro
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Any, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import logging

# Core components
from services.market_microstructure_analyzer import MarketMicrostructure, VolumeType
from services.institutional_detector import InstitutionalAnalysis, MarketPhase, ManipulationType
from services.multi_timeframe_coordinator import (
    MultiTimeframeSignal, TimeframeAlignment, TrendStrength, TimeframeData
)
from services.ta_alternative import (
    calculate_rsi, calculate_ema, calculate_sma, calculate_atr
)

logger = logging.getLogger(__name__)

class AlgorithmType(Enum):
    """Algoritmos institucionales y Smart Money únicamente"""
    # 🏛️ INSTITUCIONALES - Smart Money Analysis
    WYCKOFF_SPRING = "wyckoff_spring"
    LIQUIDITY_GRAB_FADE = "liquidity_grab_fade" 
    STOP_HUNT_REVERSAL = "stop_hunt_reversal"
    ORDER_BLOCK_RETEST = "order_block_retest"
    FAIR_VALUE_GAP = "fair_value_gap"
    
    # 🎯 PROFESIONALES - Volume & Structure
    VOLUME_BREAKOUT = "volume_breakout"  # Solo si analiza volumen institucional
    MA_ALIGNMENT = "ma_alignment"        # Alineación de múltiples timeframes
    HIGHER_HIGH_FORMATION = "higher_high_formation"  # Estructura de tendencia

class MarketRegime(Enum):
    """Regímenes de mercado"""
    STRONG_TRENDING = "strong_trending"
    WEAK_TRENDING = "weak_trending"
    RANGE_BOUND = "range_bound"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"
    ACCUMULATION = "accumulation"
    DISTRIBUTION = "distribution"
    MANIPULATION = "manipulation"

@dataclass
class AlgorithmScore:
    """Score de un algoritmo para condiciones específicas"""
    algorithm: AlgorithmType
    score: float              # 0.0 - 1.0
    confidence: float         # 0.0 - 1.0  
    reasons: List[str]        # Por qué es adecuado
    risk_factors: List[str]   # Riesgos específicos
    expected_win_rate: float  # Win rate esperado
    expected_rr: float        # Risk/reward ratio
    market_fit: float         # Qué tan bien fita el mercado actual

@dataclass
class AlgorithmSelection:
    """Resultado de la selección de algoritmo"""
    symbol: str
    timestamp: str
    
    # Primary Selection
    selected_algorithm: AlgorithmType
    selection_confidence: float
    
    # Market Context
    market_regime: MarketRegime
    regime_confidence: float
    
    # Alternative Algorithms
    algorithm_rankings: List[AlgorithmScore]
    
    # Selection Reasoning
    selection_factors: List[str]
    market_conditions: Dict[str, Any]
    
    # Performance Expectations
    expected_performance: Dict[str, float]
    risk_assessment: Dict[str, float]

class AdvancedAlgorithmSelector:
    """Selector inteligente de algoritmos con ML features"""
    
    def __init__(self):
        # Algorithm registry con sus características
        self.algorithm_characteristics = self._initialize_algorithm_characteristics()
        
        # Market regime weights para scoring
        self.regime_algorithm_weights = self._initialize_regime_weights()
        
        # Historical performance tracking (simplified ML)
        self.performance_history = {}  # algorithm -> performance metrics
        
        # Feature extractors
        self.feature_extractors = self._initialize_feature_extractors()
        
        logger.info("🤖 AdvancedAlgorithmSelector inicializado (ML-Based)")

    def select_optimal_algorithm(self, symbol: str,
                                microstructure: Optional[MarketMicrostructure],
                                institutional: Optional[InstitutionalAnalysis],
                                multi_tf: Optional[MultiTimeframeSignal],
                                timeframe_data: Dict[str, TimeframeData]) -> AlgorithmSelection:
        """
        Seleccionar algoritmo óptimo basado en análisis completo
        
        Args:
            symbol: Par de trading
            microstructure: Análisis de microestructura
            institutional: Análisis institucional
            multi_tf: Señal multi-temporal
            timeframe_data: Datos por timeframe
            
        Returns:
            AlgorithmSelection con algoritmo óptimo y reasoning
        """
        try:
            # 1. Determinar régimen de mercado actual
            market_regime, regime_confidence = self._classify_market_regime(
                microstructure, institutional, multi_tf, timeframe_data
            )
            
            # 2. Extraer features del mercado actual
            market_features = self._extract_market_features(
                microstructure, institutional, multi_tf, timeframe_data
            )
            
            # 3. Score todos los algoritmos
            algorithm_scores = self._score_all_algorithms(
                market_regime, market_features, symbol
            )
            
            # 4. Seleccionar el mejor algoritmo
            best_algorithm = max(algorithm_scores, key=lambda x: x.score)
            
            # 5. Validar selección con reglas de negocio
            validated_algorithm = self._validate_algorithm_selection(
                best_algorithm, market_regime, institutional
            )
            
            # 6. Generar expectativas de performance
            performance_expectations = self._calculate_performance_expectations(
                validated_algorithm, market_features
            )
            
            # 7. Assess risk
            risk_assessment = self._assess_algorithm_risk(
                validated_algorithm, market_regime, institutional
            )
            
            return AlgorithmSelection(
                symbol=symbol,
                timestamp=datetime.utcnow().isoformat(),
                
                selected_algorithm=validated_algorithm.algorithm,
                selection_confidence=validated_algorithm.confidence,
                
                market_regime=market_regime,
                regime_confidence=regime_confidence,
                
                algorithm_rankings=sorted(algorithm_scores, key=lambda x: x.score, reverse=True),
                
                selection_factors=validated_algorithm.reasons,
                market_conditions=market_features,
                
                expected_performance=performance_expectations,
                risk_assessment=risk_assessment
            )
            
        except Exception as e:
            logger.error(f"❌ Error en selección de algoritmo {symbol}: {e}")
            return self._generate_fallback_selection(symbol)

    def _initialize_algorithm_characteristics(self) -> Dict[AlgorithmType, Dict[str, Any]]:
        """Inicializar características de cada algoritmo"""
        
        return {
            
            
            
            
            AlgorithmType.MA_ALIGNMENT: {
                "best_regimes": [MarketRegime.STRONG_TRENDING],
                "worst_regimes": [MarketRegime.RANGE_BOUND, MarketRegime.HIGH_VOLATILITY],
                "min_trend_strength": 0.6,
                "optimal_volatility_range": (0.01, 0.04),
                "required_volume_confirmation": True,
                "timeframe_preference": ["15m", "1h"],
                "base_win_rate": 0.72,
                "base_rr": 2.5,
                "complexity": 0.3
            },
            
            AlgorithmType.VOLUME_BREAKOUT: {
                "best_regimes": [MarketRegime.LOW_VOLATILITY, MarketRegime.ACCUMULATION],
                "worst_regimes": [MarketRegime.HIGH_VOLATILITY, MarketRegime.MANIPULATION],
                "min_trend_strength": 0.0,
                "optimal_volatility_range": (0.005, 0.015),
                "required_volume_confirmation": True,
                "timeframe_preference": ["1m", "5m"],
                "base_win_rate": 0.75,
                "base_rr": 2.0,
                "complexity": 0.4
            },
            
            AlgorithmType.LIQUIDITY_GRAB_FADE: {
                "best_regimes": [MarketRegime.MANIPULATION, MarketRegime.RANGE_BOUND],
                "worst_regimes": [MarketRegime.STRONG_TRENDING],
                "min_trend_strength": 0.0,
                "optimal_volatility_range": (0.01, 0.05),
                "required_volume_confirmation": True,
                "timeframe_preference": ["1m", "5m"],
                "base_win_rate": 0.78,
                "base_rr": 1.8,
                "complexity": 0.8
            },
            
            AlgorithmType.ORDER_BLOCK_RETEST: {
                "best_regimes": [MarketRegime.WEAK_TRENDING, MarketRegime.ACCUMULATION],
                "worst_regimes": [MarketRegime.HIGH_VOLATILITY],
                "min_trend_strength": 0.3,
                "optimal_volatility_range": (0.008, 0.03),
                "required_volume_confirmation": False,
                "timeframe_preference": ["5m", "15m"],
                "base_win_rate": 0.74,
                "base_rr": 2.3,
                "complexity": 0.7
            }
        }

    def _initialize_regime_weights(self) -> Dict[MarketRegime, Dict[AlgorithmType, float]]:
        """Inicializar pesos de algoritmos por régimen de mercado"""
        
        weights = {}
        
        # Strong Trending Market
        weights[MarketRegime.STRONG_TRENDING] = {
            AlgorithmType.MA_ALIGNMENT: 1.0,
            AlgorithmType.HIGHER_HIGH_FORMATION: 0.8,
            AlgorithmType.LIQUIDITY_GRAB_FADE: 0.2
        }
        
        # Range Bound Market
        weights[MarketRegime.RANGE_BOUND] = {
            AlgorithmType.MA_ALIGNMENT: 0.2
        }
        
        # Manipulation Market
        weights[MarketRegime.MANIPULATION] = {
            AlgorithmType.LIQUIDITY_GRAB_FADE: 1.0,
            AlgorithmType.STOP_HUNT_REVERSAL: 0.9,
            AlgorithmType.WYCKOFF_SPRING: 0.8,
            AlgorithmType.ORDER_BLOCK_RETEST: 0.7,
        }
        
        # High Volatility
        weights[MarketRegime.HIGH_VOLATILITY] = {
            AlgorithmType.VOLUME_BREAKOUT: 0.8,
            AlgorithmType.LIQUIDITY_GRAB_FADE: 0.7,
        }
        
        # Default weights for other regimes
        default_weights = {algo: 0.5 for algo in AlgorithmType}
        
        for regime in MarketRegime:
            if regime not in weights:
                weights[regime] = default_weights.copy()
        
        return weights

    def _initialize_feature_extractors(self) -> Dict[str, Callable]:
        """Inicializar extractors de features del mercado"""
        
        return {
            "volatility": self._extract_volatility_features,
            "trend": self._extract_trend_features,
            "volume": self._extract_volume_features,
            "momentum": self._extract_momentum_features,
            "structure": self._extract_structure_features,
            "manipulation": self._extract_manipulation_features
        }

    def _classify_market_regime(self, microstructure: Optional[MarketMicrostructure],
                               institutional: Optional[InstitutionalAnalysis],
                               multi_tf: Optional[MultiTimeframeSignal],
                               timeframe_data: Dict[str, TimeframeData]) -> Tuple[MarketRegime, float]:
        """Clasificar régimen actual del mercado"""
        
        regime_scores = {regime: 0.0 for regime in MarketRegime}
        
        # 1. Analyze trend strength from multi-timeframe
        if multi_tf:
            if multi_tf.trend_strength.value == "very_strong":
                regime_scores[MarketRegime.STRONG_TRENDING] += 0.4
            elif multi_tf.trend_strength.value in ["strong", "moderate"]:
                regime_scores[MarketRegime.WEAK_TRENDING] += 0.3
            elif multi_tf.trend_strength.value == "sideways":
                regime_scores[MarketRegime.RANGE_BOUND] += 0.3
        
        # 2. Analyze institutional activity
        if institutional:
            if len(institutional.active_manipulations) > 0:
                regime_scores[MarketRegime.MANIPULATION] += 0.4
            
            if institutional.market_phase == MarketPhase.ACCUMULATION:
                regime_scores[MarketRegime.ACCUMULATION] += 0.3
            elif institutional.market_phase == MarketPhase.DISTRIBUTION:
                regime_scores[MarketRegime.DISTRIBUTION] += 0.3
        
        # 3. Analyze volatility
        if timeframe_data:
            # Get primary timeframe (5m or 15m)
            primary_tf = timeframe_data.get("5m") or timeframe_data.get("15m")
            if primary_tf:
                volatility = primary_tf.atr / primary_tf.closes[-1]
                
                if volatility > 0.03:  # High volatility
                    regime_scores[MarketRegime.HIGH_VOLATILITY] += 0.3
                elif volatility < 0.01:  # Low volatility
                    regime_scores[MarketRegime.LOW_VOLATILITY] += 0.3
        
        # 4. Analyze microstructure
        if microstructure:
            # Volume anomalies suggest manipulation
            if microstructure.volume_anomaly_score > 0.6:
                regime_scores[MarketRegime.MANIPULATION] += 0.2
            
            # Low liquidity suggests ranging
            if microstructure.liquidity_score < 0.4:
                regime_scores[MarketRegime.RANGE_BOUND] += 0.2
        
        # Select best regime
        best_regime = max(regime_scores.keys(), key=lambda x: regime_scores[x])
        confidence = min(0.95, regime_scores[best_regime] + 0.5)  # Base confidence + score
        
        return best_regime, confidence

    def _extract_market_features(self, microstructure: Optional[MarketMicrostructure],
                                institutional: Optional[InstitutionalAnalysis],
                                multi_tf: Optional[MultiTimeframeSignal],
                                timeframe_data: Dict[str, TimeframeData]) -> Dict[str, Any]:
        """Extraer features del mercado para ML scoring"""
        
        features = {}
        
        # Extract features using registered extractors
        for feature_name, extractor in self.feature_extractors.items():
            try:
                features[feature_name] = extractor(
                    microstructure, institutional, multi_tf, timeframe_data
                )
            except Exception as e:
                logger.warning(f"⚠️ Error extracting {feature_name}: {e}")
                features[feature_name] = {}
        
        return features

    def _extract_volatility_features(self, microstructure, institutional, multi_tf, timeframe_data) -> Dict[str, float]:
        """Extraer features de volatilidad"""
        
        features = {}
        
        if timeframe_data:
            # ATR-based volatility across timeframes
            atr_values = []
            for tf, data in timeframe_data.items():
                volatility = data.atr / data.closes[-1] if data.closes else 0
                atr_values.append(volatility)
                features[f"volatility_{tf}"] = volatility
            
            if atr_values:
                features["avg_volatility"] = np.mean(atr_values)
                features["volatility_consistency"] = 1 - np.std(atr_values)
        
        # Microstructure volatility
        if microstructure:
            features["spread_impact"] = microstructure.bid_ask_spread_impact
            features["price_divergence"] = microstructure.price_action_divergence
        
        return features

    def _extract_trend_features(self, microstructure, institutional, multi_tf, timeframe_data) -> Dict[str, float]:
        """Extraer features de tendencia"""
        
        features = {}
        
        if multi_tf:
            # Multi-timeframe trend features
            features["trend_strength_score"] = self._trend_strength_to_score(multi_tf.trend_strength)
            features["timeframe_consensus"] = multi_tf.timeframe_consensus
            features["alignment_score"] = self._alignment_to_score(multi_tf.alignment)
        
        if timeframe_data:
            # Individual timeframe trends
            trend_strengths = []
            for tf, data in timeframe_data.items():
                features[f"trend_strength_{tf}"] = data.trend_strength
                trend_strengths.append(data.trend_strength)
            
            if trend_strengths:
                features["avg_trend_strength"] = np.mean(trend_strengths)
                features["trend_consistency"] = 1 - np.std(trend_strengths)
        
        return features

    def _extract_volume_features(self, microstructure, institutional, multi_tf, timeframe_data) -> Dict[str, float]:
        """Extraer features de volumen"""
        
        features = {}
        
        if microstructure:
            features["liquidity_score"] = microstructure.liquidity_score
            features["volume_anomaly"] = microstructure.volume_anomaly_score
            features["order_flow_imbalance"] = abs(microstructure.order_flow_imbalance)
        
        if timeframe_data:
            volume_ratios = []
            for tf, data in timeframe_data.items():
                if data.volumes and data.volume_sma > 0:
                    volume_ratio = data.volumes[-1] / data.volume_sma
                    features[f"volume_ratio_{tf}"] = volume_ratio
                    volume_ratios.append(volume_ratio)
            
            if volume_ratios:
                features["avg_volume_ratio"] = np.mean(volume_ratios)
                features["volume_spike"] = max(volume_ratios) > 1.5
        
        return features

    def _extract_momentum_features(self, microstructure, institutional, multi_tf, timeframe_data) -> Dict[str, float]:
        """Extraer features de momentum"""
        
        features = {}
        
        if timeframe_data:
            momentums = []
            for tf, data in timeframe_data.items():
                features[f"momentum_{tf}"] = data.momentum
                momentums.append(abs(data.momentum))
            
            if momentums:
                features["avg_momentum"] = np.mean(momentums)
                features["momentum_consistency"] = 1 - np.std(momentums)
        
        return features

    def _extract_structure_features(self, microstructure, institutional, multi_tf, timeframe_data) -> Dict[str, float]:
        """Extraer features de estructura de mercado"""
        
        features = {}
        
        if institutional:
            features["structure_break"] = 1.0 if institutional.market_structure_break else 0.0
            features["change_of_character"] = 1.0 if institutional.change_of_character else 0.0
            features["liquidity_sweep"] = 1.0 if institutional.liquidity_sweep_detected else 0.0
            features["order_blocks_count"] = len(institutional.order_blocks)
            features["fair_value_gaps_count"] = len(institutional.fair_value_gaps)
        
        if microstructure:
            features["liquidity_zones_count"] = len(microstructure.liquidity_zones)
            features["stop_clusters_count"] = len(microstructure.stop_clusters)
        
        return features

    def _extract_manipulation_features(self, microstructure, institutional, multi_tf, timeframe_data) -> Dict[str, float]:
        """Extraer features de manipulación"""
        
        features = {}
        
        if institutional:
            features["manipulation_events_count"] = len(institutional.manipulation_events)
            features["active_manipulations_count"] = len(institutional.active_manipulations)
            features["manipulation_risk"] = institutional.manipulation_risk
            features["institutional_activity"] = institutional.large_player_activity
        
        if microstructure:
            features["institutional_footprint"] = microstructure.institutional_footprint
            features["volume_anomaly"] = microstructure.volume_anomaly_score
        
        return features

    def _score_all_algorithms(self, market_regime: MarketRegime, 
                             market_features: Dict[str, Any],
                             symbol: str) -> List[AlgorithmScore]:
        """Score todos los algoritmos para las condiciones actuales"""
        
        algorithm_scores = []
        
        for algorithm in AlgorithmType:
            score = self._score_algorithm(algorithm, market_regime, market_features)
            algorithm_scores.append(score)
        
        return algorithm_scores

    def _score_algorithm(self, algorithm: AlgorithmType, 
                        market_regime: MarketRegime,
                        market_features: Dict[str, Any]) -> AlgorithmScore:
        """Score un algoritmo específico"""
        
        characteristics = self.algorithm_characteristics.get(algorithm, {})
        
        # Base score from regime compatibility
        regime_weights = self.regime_algorithm_weights.get(market_regime, {})
        base_score = regime_weights.get(algorithm, 0.5)
        
        # Adjust score based on market features
        feature_adjustments = self._calculate_feature_adjustments(
            algorithm, characteristics, market_features
        )
        
        # Historical performance adjustment (simplified)
        historical_adjustment = self._get_historical_performance_adjustment(algorithm)
        
        # Final score calculation
        final_score = base_score * feature_adjustments * historical_adjustment
        final_score = max(0.0, min(1.0, final_score))
        
        # Calculate confidence
        confidence = self._calculate_algorithm_confidence(
            algorithm, final_score, market_features
        )
        
        # Generate reasons
        reasons = self._generate_algorithm_reasons(
            algorithm, market_regime, market_features, final_score
        )
        
        # Risk factors
        risk_factors = self._identify_algorithm_risks(
            algorithm, market_regime, market_features
        )
        
        # Expected performance
        expected_win_rate = characteristics.get("base_win_rate", 0.6) * (0.8 + final_score * 0.4)
        expected_rr = characteristics.get("base_rr", 1.5) * (0.9 + final_score * 0.2)
        
        return AlgorithmScore(
            algorithm=algorithm,
            score=final_score,
            confidence=confidence,
            reasons=reasons,
            risk_factors=risk_factors,
            expected_win_rate=expected_win_rate,
            expected_rr=expected_rr,
            market_fit=final_score
        )

    def _calculate_feature_adjustments(self, algorithm: AlgorithmType, 
                                     characteristics: Dict[str, Any],
                                     market_features: Dict[str, Any]) -> float:
        """Calcular ajustes basados en features del mercado"""
        
        adjustment = 1.0
        
        # Volatility adjustment
        volatility_features = market_features.get("volatility", {})
        avg_volatility = volatility_features.get("avg_volatility", 0.02)
        
        optimal_vol_range = characteristics.get("optimal_volatility_range", (0.01, 0.03))
        if optimal_vol_range[0] <= avg_volatility <= optimal_vol_range[1]:
            adjustment *= 1.2  # Boost for optimal volatility
        elif avg_volatility > optimal_vol_range[1] * 1.5:
            adjustment *= 0.7  # Penalty for too high volatility
        elif avg_volatility < optimal_vol_range[0] * 0.5:
            adjustment *= 0.8  # Penalty for too low volatility
        
        # Trend adjustment
        trend_features = market_features.get("trend", {})
        avg_trend_strength = trend_features.get("avg_trend_strength", 0.0)
        min_trend = characteristics.get("min_trend_strength", 0.0)
        
        if avg_trend_strength >= min_trend:
            adjustment *= (1.0 + (avg_trend_strength - min_trend) * 0.5)
        else:
            adjustment *= 0.6  # Penalty for insufficient trend
        
        # Volume adjustment
        volume_features = market_features.get("volume", {})
        requires_volume = characteristics.get("required_volume_confirmation", False)
        
        if requires_volume:
            volume_spike = volume_features.get("volume_spike", False)
            if volume_spike:
                adjustment *= 1.3
            else:
                adjustment *= 0.8
        
        return adjustment

    def _get_historical_performance_adjustment(self, algorithm: AlgorithmType) -> float:
        """Ajuste basado en performance histórica (simplified ML)"""
        
        # Simplified historical tracking
        if algorithm.value not in self.performance_history:
            return 1.0  # Neutral for new algorithms
        
        performance = self.performance_history[algorithm.value]
        recent_win_rate = performance.get("win_rate", 0.6)
        recent_profit_factor = performance.get("profit_factor", 1.0)
        
        # Adjustment based on recent performance
        if recent_win_rate > 0.7 and recent_profit_factor > 1.2:
            return 1.1  # Good performer
        elif recent_win_rate < 0.5 or recent_profit_factor < 0.8:
            return 0.9  # Poor performer
        else:
            return 1.0  # Average

    def _calculate_algorithm_confidence(self, algorithm: AlgorithmType, 
                                      score: float, 
                                      market_features: Dict[str, Any]) -> float:
        """Calcular confianza en la selección del algoritmo"""
        
        base_confidence = score
        
        # Boost confidence for simpler algorithms
        characteristics = self.algorithm_characteristics.get(algorithm, {})
        complexity = characteristics.get("complexity", 0.5)
        complexity_adjustment = 1.0 - (complexity * 0.2)  # Less penalty for complexity
        
        # Data quality adjustment
        data_quality = 1.0  # Assume good data quality for now
        
        final_confidence = base_confidence * complexity_adjustment * data_quality
        return min(0.95, max(0.1, final_confidence))

    def _generate_algorithm_reasons(self, algorithm: AlgorithmType,
                                   market_regime: MarketRegime,
                                   market_features: Dict[str, Any],
                                   score: float) -> List[str]:
        """Generar razones por la selección del algoritmo"""
        
        reasons = []
        
        # Regime compatibility
        characteristics = self.algorithm_characteristics.get(algorithm, {})
        best_regimes = characteristics.get("best_regimes", [])
        
        if market_regime in best_regimes:
            reasons.append(f"Optimal for {market_regime.value} market conditions")
        
        # Feature compatibility
        trend_features = market_features.get("trend", {})
        if trend_features.get("avg_trend_strength", 0) > 0.6:
            reasons.append("Strong trend detected")
        
        volume_features = market_features.get("volume", {})
        if volume_features.get("volume_spike", False):
            reasons.append("Volume confirmation present")
        
        if score > 0.8:
            reasons.append("High compatibility score")
        elif score > 0.6:
            reasons.append("Good market fit")
        
        return reasons

    def _identify_algorithm_risks(self, algorithm: AlgorithmType,
                                 market_regime: MarketRegime,
                                 market_features: Dict[str, Any]) -> List[str]:
        """Identificar riesgos específicos del algoritmo"""
        
        risks = []
        
        characteristics = self.algorithm_characteristics.get(algorithm, {})
        worst_regimes = characteristics.get("worst_regimes", [])
        
        if market_regime in worst_regimes:
            risks.append(f"Suboptimal for {market_regime.value} conditions")
        
        # Volatility risks
        volatility_features = market_features.get("volatility", {})
        avg_volatility = volatility_features.get("avg_volatility", 0.02)
        
        if avg_volatility > 0.04:
            risks.append("High volatility environment")
        
        # Manipulation risks
        manipulation_features = market_features.get("manipulation", {})
        if manipulation_features.get("manipulation_risk", 0) > 0.6:
            risks.append("High manipulation risk detected")
        
        return risks

    def _validate_algorithm_selection(self, best_algorithm: AlgorithmScore,
                                    market_regime: MarketRegime,
                                    institutional: Optional[InstitutionalAnalysis]) -> AlgorithmScore:
        """Validar y posiblemente override la selección"""
        
        # Override if manipulation is detected and algorithm is not suitable
        if (institutional and 
            institutional.manipulation_risk > 0.7 and
            best_algorithm.algorithm not in [AlgorithmType.LIQUIDITY_GRAB_FADE, 
                                           AlgorithmType.STOP_HUNT_REVERSAL]):
            
            # Force safer algorithm
            return AlgorithmScore(
                algorithm=AlgorithmType.LIQUIDITY_GRAB_FADE,
                score=0.8,
                confidence=0.7,
                reasons=["Override: High manipulation detected"],
                risk_factors=["Manipulation environment"],
                expected_win_rate=0.75,
                expected_rr=1.8,
                market_fit=0.8
            )
        
        return best_algorithm

    def _calculate_performance_expectations(self, algorithm: AlgorithmScore,
                                          market_features: Dict[str, Any]) -> Dict[str, float]:
        """Calcular expectativas de performance"""
        
        return {
            "expected_win_rate": algorithm.expected_win_rate,
            "expected_risk_reward": algorithm.expected_rr,
            "expected_profit_factor": algorithm.expected_win_rate * algorithm.expected_rr,
            "confidence_level": algorithm.confidence,
            "market_fit_score": algorithm.market_fit
        }

    def _assess_algorithm_risk(self, algorithm: AlgorithmScore,
                              market_regime: MarketRegime,
                              institutional: Optional[InstitutionalAnalysis]) -> Dict[str, float]:
        """Evaluar riesgo del algoritmo seleccionado"""
        
        base_risk = 1.0 - algorithm.score
        
        # Adjust for market regime
        if market_regime == MarketRegime.HIGH_VOLATILITY:
            base_risk *= 1.3
        elif market_regime == MarketRegime.MANIPULATION:
            base_risk *= 1.5
        
        # Adjust for institutional risk
        if institutional and institutional.manipulation_risk > 0.6:
            base_risk *= 1.2
        
        return {
            "overall_risk": min(1.0, base_risk),
            "volatility_risk": min(1.0, base_risk * 0.7),
            "manipulation_risk": institutional.manipulation_risk if institutional else 0.3,
            "execution_risk": algorithm.risk_factors.__len__() * 0.1
        }

    # Utility functions
    
    def _trend_strength_to_score(self, trend_strength: TrendStrength) -> float:
        """Convert trend strength enum to score"""
        mapping = {
            TrendStrength.VERY_STRONG: 1.0,
            TrendStrength.STRONG: 0.8,
            TrendStrength.MODERATE: 0.6,
            TrendStrength.WEAK: 0.4,
            TrendStrength.SIDEWAYS: 0.0
        }
        return mapping.get(trend_strength, 0.5)
    
    def _alignment_to_score(self, alignment: TimeframeAlignment) -> float:
        """Convert timeframe alignment to score"""
        if "FULLY_ALIGNED" in alignment.value:
            return 1.0
        elif "PARTIALLY_ALIGNED" in alignment.value:
            return 0.7
        elif alignment == TimeframeAlignment.NEUTRAL:
            return 0.5
        else:  # CONFLICTED
            return 0.2

    def _generate_fallback_selection(self, symbol: str) -> AlgorithmSelection:
        """Generar selección fallback cuando hay errores"""
        
        fallback_score = AlgorithmScore(
            algorithm=AlgorithmType.WYCKOFF_SPRING,
            score=0.5,
            confidence=0.5,
            reasons=["Fallback selection due to error"],
            risk_factors=["Insufficient analysis"],
            expected_win_rate=0.6,
            expected_rr=1.5,
            market_fit=0.5
        )
        
        return AlgorithmSelection(
            symbol=symbol,
            timestamp=datetime.utcnow().isoformat(),
            
            selected_algorithm=AlgorithmType.WYCKOFF_SPRING,
            selection_confidence=0.5,
            
            market_regime=MarketRegime.RANGE_BOUND,
            regime_confidence=0.5,
            
            algorithm_rankings=[fallback_score],
            
            selection_factors=["Error fallback"],
            market_conditions={},
            
            expected_performance={"expected_win_rate": 0.6, "expected_risk_reward": 1.5},
            risk_assessment={"overall_risk": 0.5}
        )


# Testing function
def test_advanced_algorithm_selector():
    """Test del selector avanzado de algoritmos"""
    print("🧪 Testing AdvancedAlgorithmSelector...")
    
    selector = AdvancedAlgorithmSelector()
    
    # Mock data for testing
    from services.market_microstructure_analyzer import MarketMicrostructure, VolumeType
    from services.institutional_detector import InstitutionalAnalysis, MarketPhase
    from services.multi_timeframe_coordinator import MultiTimeframeSignal, TrendStrength, TimeframeAlignment
    
    # Create mock microstructure
    mock_microstructure = MarketMicrostructure(
        symbol="BTCUSDT",
        timeframe="5m",
        timestamp=datetime.utcnow().isoformat(),
        point_of_control=50000,
        value_area_high=50500,
        value_area_low=49500,
        volume_profile_levels=[],
        delta_cumulative=1000,
        delta_current=100,
        order_flow_imbalance=0.3,
        dominant_side=VolumeType.BUYING_PRESSURE,
        liquidity_zones=[],
        absorption_levels=[],
        stop_clusters=[],
        bid_ask_spread_impact=0.001,
        market_depth_score=0.8,
        liquidity_score=0.7,
        volume_anomaly_score=0.2,
        price_action_divergence=0.1,
        institutional_footprint=0.4
    )
    
    # Create mock institutional analysis
    mock_institutional = InstitutionalAnalysis(
        symbol="BTCUSDT",
        timeframe="5m",
        timestamp=datetime.utcnow().isoformat(),
        manipulation_events=[],
        active_manipulations=[],
        market_phase=MarketPhase.MARKUP,
        wyckoff_signals=[],
        accumulation_distribution_line=0.0,
        market_structure_break=False,
        change_of_character=False,
        order_blocks=[],
        fair_value_gaps=[],
        liquidity_sweep_detected=False,
        large_player_activity=0.3,
        retail_sentiment_score=0.7,
        smart_money_flow="INFLOW",
        manipulation_risk=0.2,
        trade_safety_score=0.8,
        recommended_action="FOLLOW"
    )
    
    # Create mock multi-timeframe signal
    mock_multi_tf = MultiTimeframeSignal(
        symbol="BTCUSDT",
        timestamp=datetime.utcnow().isoformat(),
        signal="BUY",
        confidence=0.75,
        alignment=TimeframeAlignment.PARTIALLY_ALIGNED_BULLISH,
        trend_strength=TrendStrength.STRONG,
        timeframe_consensus=0.8,
        tf_1m_signal="BUY",
        tf_5m_signal="BUY",
        tf_15m_signal="BUY",
        tf_1h_signal="HOLD",
        risk_level=0.3,
        risk_factors=[],
        entry_price=50000,
        stop_loss=49500,
        take_profit_1=51000,
        take_profit_2=52000,
        entry_timeframe="1m",
        hold_timeframe="5m",
        signal_quality="HIGH",
        expected_duration="SCALP"
    )
    
    # Create mock timeframe data
    from services.multi_timeframe_coordinator import TimeframeData
    
    mock_tf_data = {
        "5m": TimeframeData(
            timeframe="5m",
            opens=[49900] * 60,
            highs=[50100] * 60,
            lows=[49800] * 60,
            closes=[50000] * 60,
            volumes=[1500] * 60,
            rsi=45,
            ema_9=49950,
            ema_21=49900,
            ema_50=49800,
            ema_200=49000,
            atr=200,
            volume_sma=1400,
            trend_direction="BULLISH",
            trend_strength=0.7,
            momentum=0.02,
            key_support=49500,
            key_resistance=50500,
            data_quality=0.9,
            reliability=0.8
        )
    }
    
    # Test algorithm selection
    selection = selector.select_optimal_algorithm(
        "BTCUSDT", mock_microstructure, mock_institutional, mock_multi_tf, mock_tf_data
    )
    
    print(f"🤖 Selección de Algoritmo {selection.symbol}:")
    print(f"  Algoritmo Seleccionado: {selection.selected_algorithm.value}")
    print(f"  Confianza: {selection.selection_confidence:.0%}")
    print(f"  Régimen de Mercado: {selection.market_regime.value}")
    print(f"  Confianza Régimen: {selection.regime_confidence:.0%}")
    
    print(f"\n  🏆 Top 3 Algoritmos:")
    for i, algo_score in enumerate(selection.algorithm_rankings[:3]):
        print(f"    {i+1}. {algo_score.algorithm.value}: {algo_score.score:.0%} "
              f"(Win Rate: {algo_score.expected_win_rate:.0%}, R:R: {algo_score.expected_rr:.1f})")
    
    if selection.selection_factors:
        print(f"\n  ✅ Factores de Selección: {', '.join(selection.selection_factors)}")
    
    print(f"\n  📈 Expectativas Performance:")
    for key, value in selection.expected_performance.items():
        print(f"    {key}: {value:.0%}" if "rate" in key or "level" in key else f"    {key}: {value:.2f}")
    
    print(f"\n  ⚠️ Evaluación Riesgo:")
    for key, value in selection.risk_assessment.items():
        print(f"    {key}: {value:.0%}")
    
    print("✅ AdvancedAlgorithmSelector test completado")

if __name__ == "__main__":
    test_advanced_algorithm_selector()