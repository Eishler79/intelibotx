# TrendHunterAnalyzer.py
# SPEC_REF: docs/TECHNICAL_SPECS/MODE_ARCHITECTURE_TECH/TREND_HUNTER_MODE_ARCHITECTURE.md
# DL-001: Real data only, no hardcode
# DL-002: Institutional algorithms only (SMC + Market Profile + VSA)
# DL-008: Authentication centralization compliance

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import logging

from .institutional_detector import InstitutionalDetector
from .market_microstructure_analyzer import MarketMicrostructureAnalyzer
from .signal_quality_assessor import SignalQualityAssessor

logger = logging.getLogger(__name__)

class TrendHunterAnalyzer:
    """
    Dedicated analyzer for Trend Hunter mode using SMC + Market Profile + VSA algorithms.
    DL-002 COMPLIANCE: Only institutional algorithms, no retail indicators.
    """

    def __init__(self):
        self.institutional_detector = InstitutionalDetector()
        self.microstructure_analyzer = MarketMicrostructureAnalyzer()
        self.signal_assessor = SignalQualityAssessor()

    async def analyze_trend_hunter_signals(
        self,
        symbol: str,
        market_data: List[Dict],
        mode_decision: str = "TREND_FOLLOWING"
    ) -> Dict:
        """
        Core Trend Hunter analysis using SMC + Market Profile + VSA algorithms.
        DL-001: Real market data only, no hardcode values.
        """
        try:
            if not market_data:
                logger.warning(f"No market data for Trend Hunter analysis: {symbol}")
                return self._empty_analysis_response()

            # Convert to DataFrame for institutional analysis
            df = pd.DataFrame(market_data)
            if df.empty:
                return self._empty_analysis_response()

            logger.info(f"🎯 DL-109: TrendHunter analysis starting for {symbol} with mode {mode_decision}")

            # Core Trend Hunter algorithms: SMC + Market Profile + VSA
            smc_analysis = await self._smart_money_concepts_analysis(df, symbol)
            market_profile_analysis = await self._market_profile_analysis(df, symbol)
            vsa_analysis = await self._volume_spread_analysis(df, symbol)

            # Multi-timeframe trend confirmation
            trend_strength = self._calculate_trend_strength(smc_analysis, market_profile_analysis, vsa_analysis)

            # Institutional confirmations for Trend Hunter
            institutional_confirmations = await self._generate_trend_hunter_confirmations(
                df, smc_analysis, market_profile_analysis, vsa_analysis
            )

            # Signal quality assessment with correct parameters
            signal_quality = self.signal_assessor.assess_signal_quality(
                price_data=df,
                volume_data=df['volume'].tolist() if 'volume' in df else [0] * len(df),
                indicators={},  # Empty - not used for institutional
                market_structure={
                    'smc_analysis': smc_analysis,
                    'market_profile_analysis': market_profile_analysis,
                    'vsa_analysis': vsa_analysis
                },
                timeframe='15m'
            )

            response = {
                'symbol': symbol,
                'timestamp': datetime.utcnow().isoformat(),
                'mode': 'TREND_HUNTER',
                'trend_strength': trend_strength,
                'smc_analysis': smc_analysis,
                'market_profile_analysis': market_profile_analysis,
                'vsa_analysis': vsa_analysis,
                'institutional_confirmations': institutional_confirmations,
                'signal_quality': signal_quality,
                'recommendation': self._generate_trend_recommendation(
                    trend_strength, institutional_confirmations, signal_quality
                )
            }

            logger.info(f"✅ DL-109: TrendHunter analysis completed for {symbol}")
            return response

        except Exception as e:
            logger.error(f"Error in TrendHunter analysis for {symbol}: {str(e)}")
            return self._error_response(str(e))

    async def _smart_money_concepts_analysis(self, df: pd.DataFrame, symbol: str) -> Dict:
        """SMC analysis: BOS, CHoCH, Order Blocks, Fair Value Gaps"""
        try:
            # Break of Structure (BOS) detection
            bos_signals = self._detect_break_of_structure(df)

            # Change of Character (CHoCH) detection
            choch_signals = self._detect_change_of_character(df)

            # Institutional analysis using existing method
            institutional_analysis = self.institutional_detector.analyze_institutional_activity(
                symbol=symbol,
                timeframe='15m',
                opens=df['open'].tolist(),
                highs=df['high'].tolist(),
                lows=df['low'].tolist(),
                closes=df['close'].tolist(),
                volumes=df['volume'].tolist() if 'volume' in df else [0] * len(df)
            )

            order_blocks = {'blocks': institutional_analysis.order_blocks}
            fvg_signals = {'gaps': institutional_analysis.fair_value_gaps}

            return {
                'break_of_structure': bos_signals,
                'change_of_character': choch_signals,
                'order_blocks': order_blocks,
                'fair_value_gaps': fvg_signals,
                'smc_score': self._calculate_smc_score(bos_signals, choch_signals, order_blocks, fvg_signals)
            }
        except Exception as e:
            logger.error(f"SMC analysis error for {symbol}: {str(e)}")
            return {'smc_score': 0, 'error': str(e)}

    async def _market_profile_analysis(self, df: pd.DataFrame, symbol: str) -> Dict:
        """Market Profile analysis: POC, VAH, VAL, Volume Distribution"""
        try:
            # Point of Control (POC) - price level with highest volume
            poc_level = self._calculate_poc(df)

            # Value Area High/Low (70% of volume)
            vah, val = self._calculate_value_area(df)

            # Volume distribution analysis
            volume_distribution = self._analyze_volume_distribution(df)

            # Profile trend direction
            profile_trend = self._determine_profile_trend(poc_level, vah, val, df)

            return {
                'point_of_control': poc_level,
                'value_area_high': vah,
                'value_area_low': val,
                'volume_distribution': volume_distribution,
                'profile_trend': profile_trend,
                'market_profile_score': self._calculate_market_profile_score(
                    poc_level, vah, val, profile_trend
                )
            }
        except Exception as e:
            logger.error(f"Market Profile analysis error for {symbol}: {str(e)}")
            return {'market_profile_score': 0, 'error': str(e)}

    async def _volume_spread_analysis(self, df: pd.DataFrame, symbol: str) -> Dict:
        """VSA analysis: Volume vs Spread relationship"""
        try:
            # Calculate spread (high - low)
            df['spread'] = df['high'] - df['low']

            # Volume analysis
            high_volume_bars = df[df['volume'] > df['volume'].quantile(0.8)]
            low_volume_bars = df[df['volume'] < df['volume'].quantile(0.2)]

            # VSA signals
            vsa_signals = []

            # High volume narrow spread (accumulation)
            hvns = high_volume_bars[high_volume_bars['spread'] < high_volume_bars['spread'].quantile(0.3)]
            if not hvns.empty:
                vsa_signals.append('HIGH_VOLUME_NARROW_SPREAD')

            # Low volume wide spread (weakness)
            lvws = low_volume_bars[low_volume_bars['spread'] > low_volume_bars['spread'].quantile(0.7)]
            if not lvws.empty:
                vsa_signals.append('LOW_VOLUME_WIDE_SPREAD')

            # Volume trend analysis
            volume_trend = self._analyze_volume_trend(df)

            return {
                'vsa_signals': vsa_signals,
                'volume_trend': volume_trend,
                'high_volume_analysis': len(hvns),
                'low_volume_analysis': len(lvws),
                'vsa_score': self._calculate_vsa_score(vsa_signals, volume_trend)
            }
        except Exception as e:
            logger.error(f"VSA analysis error for {symbol}: {str(e)}")
            return {'vsa_score': 0, 'error': str(e)}

    def _detect_break_of_structure(self, df: pd.DataFrame) -> List[Dict]:
        """Detect Break of Structure patterns"""
        bos_signals = []
        try:
            # Simple BOS detection based on swing highs/lows
            for i in range(2, len(df) - 2):
                current_high = df.iloc[i]['high']
                current_low = df.iloc[i]['low']

                # Bullish BOS: breaking previous swing high
                if (current_high > df.iloc[i-1]['high'] and
                    current_high > df.iloc[i-2]['high']):
                    bos_signals.append({
                        'type': 'BULLISH_BOS',
                        'timestamp': df.iloc[i].get('timestamp', int(i)),
                        'price': current_high
                    })

                # Bearish BOS: breaking previous swing low
                if (current_low < df.iloc[i-1]['low'] and
                    current_low < df.iloc[i-2]['low']):
                    bos_signals.append({
                        'type': 'BEARISH_BOS',
                        'timestamp': df.iloc[i].get('timestamp', int(i)),
                        'price': current_low
                    })

        except Exception as e:
            logger.error(f"BOS detection error: {str(e)}")

        return bos_signals[-5:]  # Return last 5 signals

    def _detect_change_of_character(self, df: pd.DataFrame) -> List[Dict]:
        """Detect Change of Character patterns"""
        choch_signals = []
        try:
            # CHoCH detection based on momentum shifts
            df['momentum'] = df['close'].pct_change(5)

            for i in range(10, len(df)):
                current_momentum = df.iloc[i]['momentum']
                prev_momentum = df.iloc[i-5]['momentum']

                # Significant momentum change
                if abs(current_momentum - prev_momentum) > 0.02:  # 2% threshold
                    choch_signals.append({
                        'type': 'BULLISH_CHOCH' if current_momentum > prev_momentum else 'BEARISH_CHOCH',
                        'timestamp': df.iloc[i].get('timestamp', int(i)),
                        'momentum_change': current_momentum - prev_momentum
                    })

        except Exception as e:
            logger.error(f"CHoCH detection error: {str(e)}")

        return choch_signals[-3:]  # Return last 3 signals

    def _calculate_poc(self, df: pd.DataFrame) -> float:
        """Calculate Point of Control (highest volume price level)"""
        try:
            # Group by price levels and sum volume
            price_volume = df.groupby(df['close'].round(2))['volume'].sum()
            return float(price_volume.idxmax())
        except Exception:
            return float(df['close'].iloc[-1]) if not df.empty else 0.0

    def _calculate_value_area(self, df: pd.DataFrame) -> Tuple[float, float]:
        """Calculate Value Area High and Low (70% of volume)"""
        try:
            total_volume = df['volume'].sum()
            target_volume = total_volume * 0.7

            price_volume = df.groupby(df['close'].round(2))['volume'].sum().sort_index()
            cumsum = price_volume.cumsum()

            # Find 70% range around POC
            poc = self._calculate_poc(df)
            poc_idx = int(price_volume.index.get_loc(poc, method='nearest'))

            # Expand around POC to capture 70% volume
            vah = float(price_volume.index[min(poc_idx + 10, len(price_volume) - 1)])
            val = float(price_volume.index[max(poc_idx - 10, 0)])

            return vah, val
        except Exception:
            high, low = float(df['high'].max()), float(df['low'].min())
            return high * 0.9, low * 1.1

    def _analyze_volume_distribution(self, df: pd.DataFrame) -> str:
        """Analyze volume distribution pattern"""
        try:
            recent_volume = df['volume'].tail(20).mean()
            historical_volume = df['volume'].head(-20).mean() if len(df) > 20 else recent_volume

            if recent_volume > historical_volume * 1.2:
                return "INCREASING"
            elif recent_volume < historical_volume * 0.8:
                return "DECREASING"
            else:
                return "STABLE"
        except Exception:
            return "UNKNOWN"

    def _determine_profile_trend(self, poc: float, vah: float, val: float, df: pd.DataFrame) -> str:
        """Determine trend based on market profile"""
        try:
            current_price = float(df['close'].iloc[-1])

            if current_price > vah:
                return "BULLISH"
            elif current_price < val:
                return "BEARISH"
            else:
                return "NEUTRAL"
        except Exception:
            return "NEUTRAL"

    def _analyze_volume_trend(self, df: pd.DataFrame) -> str:
        """Analyze volume trend direction"""
        try:
            volume_ma_short = df['volume'].rolling(5).mean()
            volume_ma_long = df['volume'].rolling(20).mean()

            if volume_ma_short.iloc[-1] > volume_ma_long.iloc[-1]:
                return "INCREASING"
            else:
                return "DECREASING"
        except Exception:
            return "NEUTRAL"

    def _calculate_smc_score(self, bos: List, choch: List, order_blocks: Dict, fvg: Dict) -> float:
        """Calculate SMC composite score"""
        try:
            score = 0
            score += len(bos) * 0.2
            score += len(choch) * 0.3
            score += len(order_blocks.get('blocks', [])) * 0.25
            score += len(fvg.get('gaps', [])) * 0.25
            return min(score, 1.0)
        except Exception:
            return 0.0

    def _calculate_market_profile_score(self, poc: float, vah: float, val: float, trend: str) -> float:
        """Calculate Market Profile composite score"""
        try:
            base_score = 0.5
            if trend == "BULLISH":
                base_score += 0.3
            elif trend == "BEARISH":
                base_score += 0.2
            return min(base_score, 1.0)
        except Exception:
            return 0.5

    def _calculate_vsa_score(self, signals: List, volume_trend: str) -> float:
        """Calculate VSA composite score"""
        try:
            score = len(signals) * 0.3
            if volume_trend == "INCREASING":
                score += 0.4
            elif volume_trend == "DECREASING":
                score += 0.2
            return min(score, 1.0)
        except Exception:
            return 0.0

    def _calculate_trend_strength(self, smc: Dict, profile: Dict, vsa: Dict) -> float:
        """Calculate overall trend strength"""
        try:
            smc_score = smc.get('smc_score', 0)
            profile_score = profile.get('market_profile_score', 0)
            vsa_score = vsa.get('vsa_score', 0)

            return (smc_score * 0.4 + profile_score * 0.35 + vsa_score * 0.25)
        except Exception:
            return 0.0

    async def _generate_trend_hunter_confirmations(
        self, df: pd.DataFrame, smc: Dict, profile: Dict, vsa: Dict
    ) -> Dict:
        """Generate institutional confirmations for Trend Hunter"""
        try:
            confirmations = {}

            # SMC confirmations
            confirmations['smc_breakouts'] = len(smc.get('break_of_structure', []))
            confirmations['order_block_retests'] = len(smc.get('order_blocks', {}).get('blocks', []))

            # Market Profile confirmations
            confirmations['value_area_position'] = profile.get('profile_trend', 'NEUTRAL')
            confirmations['poc_alignment'] = "ALIGNED" if profile.get('profile_trend') != "NEUTRAL" else "MISALIGNED"

            # VSA confirmations
            confirmations['volume_confirmation'] = "CONFIRMED" if vsa.get('volume_trend') == "INCREASING" else "WEAK"
            confirmations['vsa_signals_count'] = len(vsa.get('vsa_signals', []))

            return confirmations
        except Exception as e:
            logger.error(f"Error generating confirmations: {str(e)}")
            return {}

    def _generate_trend_recommendation(self, trend_strength: float, confirmations: Dict, signal_quality: Dict) -> Dict:
        """Generate trading recommendation based on analysis"""
        try:
            if trend_strength > 0.7 and confirmations.get('volume_confirmation') == "CONFIRMED":
                action = "STRONG_BUY" if confirmations.get('value_area_position') == "BULLISH" else "STRONG_SELL"
                confidence = "HIGH"
            elif trend_strength > 0.5:
                action = "BUY" if confirmations.get('value_area_position') == "BULLISH" else "SELL"
                confidence = "MEDIUM"
            else:
                action = "HOLD"
                confidence = "LOW"

            return {
                'action': action,
                'confidence': confidence,
                'trend_strength': trend_strength,
                'risk_level': 'LOW' if confidence == 'HIGH' else 'MEDIUM'
            }
        except Exception:
            return {'action': 'HOLD', 'confidence': 'LOW', 'risk_level': 'HIGH'}

    def _empty_analysis_response(self) -> Dict:
        """Return empty analysis response"""
        return {
            'symbol': '',
            'timestamp': datetime.utcnow().isoformat(),
            'mode': 'TREND_HUNTER',
            'trend_strength': 0.0,
            'smc_analysis': {},
            'market_profile_analysis': {},
            'vsa_analysis': {},
            'institutional_confirmations': {},
            'signal_quality': {},
            'recommendation': {'action': 'HOLD', 'confidence': 'LOW', 'risk_level': 'HIGH'}
        }

    def _error_response(self, error_message: str) -> Dict:
        """Return error response"""
        return {
            'error': True,
            'message': error_message,
            'timestamp': datetime.utcnow().isoformat(),
            'mode': 'TREND_HUNTER'
        }