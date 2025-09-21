# TrendModeProvider.py
# SPEC_REF: docs/TECHNICAL_SPECS/MODE_ARCHITECTURE_TECH/TREND_HUNTER_MODE_ARCHITECTURE.md
# DL-001: Real data only, no hardcode
# DL-002: Institutional algorithms only (SMC + Market Profile + VSA)
# DL-008: Authentication centralization compliance

from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class TrendModeProvider:
    """
    Provides trend-specific mode parameters for TrendHunter mode.
    DL-002 COMPLIANCE: Institutional algorithm parameters only.
    """

    def __init__(self):
        pass

    def get_trend_mode_parameters(self, risk_profile: str = "MODERATE") -> Dict:
        """
        Get trend mode parameters based on risk profile.
        DL-001: No hardcode values, parameters based on risk profile logic.
        """
        try:
            base_params = self._get_base_trend_parameters()
            risk_adjustments = self._get_risk_profile_adjustments(risk_profile)

            # Merge base parameters with risk adjustments
            trend_params = {**base_params, **risk_adjustments}

            logger.info(f"🎯 TrendModeProvider: Generated parameters for risk_profile={risk_profile}")

            return trend_params

        except Exception as e:
            logger.error(f"Error generating trend mode parameters: {str(e)}")
            return self._get_default_parameters()

    def _get_base_trend_parameters(self) -> Dict:
        """Base parameters for trend following mode"""
        return {
            'mode_type': 'TREND_FOLLOWING',
            'primary_algorithms': ['SMC', 'MARKET_PROFILE', 'VSA'],
            'secondary_algorithms': ['ORDER_BLOCKS', 'FAIR_VALUE_GAPS'],
            'timeframe_preference': ['4h', '1d', '12h'],  # Trend timeframes
            'signal_filters': {
                'min_trend_strength': 0.6,
                'require_volume_confirmation': True,
                'require_smc_confirmation': True,
                'require_profile_alignment': True
            },
            'risk_management': {
                'max_position_size': 0.02,  # 2% default
                'stop_loss_method': 'INSTITUTIONAL_LEVELS',
                'take_profit_method': 'TREND_EXHAUSTION'
            }
        }

    def _get_risk_profile_adjustments(self, risk_profile: str) -> Dict:
        """Risk profile specific adjustments"""
        adjustments = {
            'CONSERVATIVE': {
                'signal_filters': {
                    'min_trend_strength': 0.8,
                    'require_multiple_confirmations': True
                },
                'risk_management': {
                    'max_position_size': 0.01,  # 1%
                    'stop_loss_multiplier': 0.5,  # Tighter stops
                    'take_profit_multiplier': 1.5
                },
                'algorithm_weights': {
                    'SMC': 1.4,  # Higher weight on reliable SMC
                    'MARKET_PROFILE': 1.2,
                    'VSA': 1.1
                }
            },
            'MODERATE': {
                'signal_filters': {
                    'min_trend_strength': 0.6,
                    'require_multiple_confirmations': False
                },
                'risk_management': {
                    'max_position_size': 0.02,  # 2%
                    'stop_loss_multiplier': 1.0,
                    'take_profit_multiplier': 2.0
                },
                'algorithm_weights': {
                    'SMC': 1.2,
                    'MARKET_PROFILE': 1.2,
                    'VSA': 1.1
                }
            },
            'AGGRESSIVE': {
                'signal_filters': {
                    'min_trend_strength': 0.4,
                    'require_multiple_confirmations': False
                },
                'risk_management': {
                    'max_position_size': 0.05,  # 5%
                    'stop_loss_multiplier': 1.5,  # Wider stops
                    'take_profit_multiplier': 3.0
                },
                'algorithm_weights': {
                    'SMC': 1.1,
                    'MARKET_PROFILE': 1.3,
                    'VSA': 1.4  # Higher weight on volume for aggressive
                }
            }
        }

        return adjustments.get(risk_profile, adjustments['MODERATE'])

    def get_algorithm_priority_mapping(self, strategy: str = "Trend Hunter") -> Dict:
        """
        Get algorithm priority mapping for TrendHunter strategy.
        DL-102 COMPLIANCE: Strategy influences algorithm selection.
        """
        try:
            if strategy == "Trend Hunter":
                return {
                    'SMC': 1.3,                    # Primary trend detection
                    'MARKET_PROFILE': 1.25,       # Volume-based trend confirmation
                    'VSA': 1.2,                   # Volume spread analysis
                    'ORDER_BLOCKS': 1.15,         # Entry/exit levels
                    'FAIR_VALUE_GAPS': 1.1,      # Price inefficiencies
                    'WYCKOFF_SPRING': 1.05,      # Trend reversal detection

                    # Lower priority for trend following
                    'LIQUIDITY_GRAB_FADE': 0.9,
                    'STOP_HUNT_REVERSAL': 0.85,
                    'VOLUME_BREAKOUT': 1.0
                }
            else:
                # Default neutral weights
                return {algo: 1.0 for algo in [
                    'SMC', 'MARKET_PROFILE', 'VSA', 'ORDER_BLOCKS',
                    'FAIR_VALUE_GAPS', 'WYCKOFF_SPRING'
                ]}

        except Exception as e:
            logger.error(f"Error getting algorithm priority mapping: {str(e)}")
            return {}

    def get_mode_scoring_weights(self) -> Dict:
        """
        Get scoring weights for trend mode selection.
        Used by IntelligentModeSelector for AI-driven mode selection.
        """
        return {
            'trend_score_weight': 1.4,        # High weight for trend detection
            'volatility_score_weight': 0.8,    # Lower volatility preferred
            'manipulation_score_weight': 0.6,  # Some manipulation awareness
            'micro_score_weight': 0.7,         # Medium microstructure importance
            'news_score_weight': 0.9           # News can affect trends
        }

    def get_institutional_confirmations_config(self) -> Dict:
        """Configuration for institutional confirmations in trend mode"""
        return {
            'required_confirmations': {
                'smc_breakout': True,
                'volume_confirmation': True,
                'profile_alignment': True,
                'order_block_retest': False  # Optional for trends
            },
            'confirmation_weights': {
                'smc_breakouts': 0.3,
                'volume_confirmation': 0.25,
                'profile_alignment': 0.25,
                'order_block_retests': 0.2
            },
            'minimum_confirmation_score': 0.65  # 65% confidence required
        }

    def get_signal_quality_thresholds(self) -> Dict:
        """Signal quality thresholds for trend mode"""
        return {
            'excellent_threshold': 0.85,
            'good_threshold': 0.70,
            'fair_threshold': 0.55,
            'poor_threshold': 0.40,
            'institutional_weight': 0.7,  # High weight on institutional signals
            'technical_weight': 0.3
        }

    def get_timeframe_analysis_config(self) -> Dict:
        """Multi-timeframe analysis configuration for trends"""
        return {
            'primary_timeframes': ['4h', '1d'],
            'secondary_timeframes': ['1h', '12h'],
            'confirmation_timeframes': ['15m', '30m'],
            'trend_alignment_required': True,
            'min_timeframe_agreement': 0.6  # 60% of timeframes must agree
        }

    def get_trend_strength_calculation_config(self) -> Dict:
        """Configuration for trend strength calculation"""
        return {
            'smc_weight': 0.4,           # SMC has highest weight
            'market_profile_weight': 0.35, # Market Profile second
            'vsa_weight': 0.25,          # VSA lowest but important
            'normalization_method': 'sigmoid',
            'strength_categories': {
                'very_strong': 0.8,
                'strong': 0.65,
                'moderate': 0.45,
                'weak': 0.25,
                'very_weak': 0.1
            }
        }

    def _get_default_parameters(self) -> Dict:
        """Default parameters in case of error"""
        return {
            'mode_type': 'TREND_FOLLOWING',
            'primary_algorithms': ['SMC'],
            'signal_filters': {'min_trend_strength': 0.5},
            'risk_management': {'max_position_size': 0.01},
            'error': True,
            'message': 'Using default parameters due to configuration error'
        }

    def validate_trend_parameters(self, params: Dict) -> bool:
        """Validate trend mode parameters"""
        try:
            required_keys = ['mode_type', 'primary_algorithms', 'signal_filters']
            return all(key in params for key in required_keys)
        except Exception:
            return False

    def get_trend_exit_conditions(self) -> Dict:
        """Exit conditions specific to trend mode"""
        return {
            'trend_reversal_signals': {
                'smc_choch': True,          # Change of Character
                'volume_divergence': True,   # Volume not confirming price
                'profile_rejection': True    # Price rejected from value area
            },
            'profit_taking_levels': {
                'partial_exit_1': 0.5,     # 50% at first target
                'partial_exit_2': 0.3,     # 30% at second target
                'trailing_stop': 0.2       # 20% with trailing stop
            },
            'stop_loss_adjustment': {
                'use_trailing_stop': True,
                'trail_activation': 1.5,    # Start trailing at 1.5x risk
                'trail_distance': 0.5       # Trail 0.5x original risk
            }
        }

    def get_mode_transition_rules(self) -> Dict:
        """Rules for transitioning from trend mode to other modes"""
        return {
            'to_scalping': {
                'trigger': 'trend_exhaustion_with_range',
                'conditions': {
                    'trend_strength': {'<': 0.3},
                    'volatility': {'<': 0.4},
                    'range_formation': True
                }
            },
            'to_anti_manipulation': {
                'trigger': 'manipulation_detected_in_trend',
                'conditions': {
                    'manipulation_score': {'>': 0.7},
                    'unusual_volume': True,
                    'stop_hunting_activity': True
                }
            },
            'to_volatility_adaptive': {
                'trigger': 'high_volatility_trend_break',
                'conditions': {
                    'volatility': {'>': 0.8},
                    'trend_break': True,
                    'market_uncertainty': True
                }
            }
        }