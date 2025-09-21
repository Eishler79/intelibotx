"""Parametrización DL-001 para algoritmos institucionales (fase 1)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class WyckoffParams:
    min_bars: int
    phase_scores: Dict[str, int]
    price_change_threshold: float
    volume_change_threshold: float
    divergence_scores: Dict[str, int]
    insufficient_score: int


@dataclass
class OrderBlockParams:
    min_bars: int
    volume_multiplier: float
    retest_buffer: float
    mixed_score: int
    directional_bonus: int
    neutral_score: int


@dataclass
class LiquidityGrabParams:
    lookback: int
    recent_window: int
    spike_multiplier: float
    volume_multiplier: float
    high_activity_threshold: int
    medium_activity_threshold: int


@dataclass
class StopHuntingParams:
    min_bars: int
    wick_multiplier: float
    volume_ratio: float
    lookback: int
    recent_window: int


@dataclass
class FairValueGapParams:
    min_bars: int
    detection_ratio: float
    proximity_ratio: float
    mitigation_window: int
    base_score: int
    bonus_per_gap: int
    max_bonus: int


@dataclass
class MicrostructureParams:
    structure_window: int
    volume_window: int
    imbalance_multiplier: float
    concentration_high: float
    concentration_medium: float
    neutral_score: int


@dataclass
class VsaParams:
    lookback: int
    high_volume_multiplier: float
    ultra_volume_multiplier: float
    narrow_spread_ratio: float
    wide_spread_ratio: float
    pattern_window: int


@dataclass
class MarketProfileParams:
    lookback: int
    value_area_ratio: float
    imbalance_threshold: float
    poc_window: int


@dataclass
class OrderFlowParams:
    lookback: int
    imbalance_threshold: float
    delta_threshold: float
    confirmation_window: int


@dataclass
class AccumulationDistributionParams:
    lookback: int
    accumulation_threshold: float
    distribution_threshold: float
    confirmation_window: int


@dataclass
class SmcParams:
    confirmation_threshold: int
    smart_weight: float
    trap_penalty: float
    neutral_floor: float


@dataclass
class CompositeManParams:
    accumulation_min: int
    distribution_min: int
    neutral_min: int
    emphasis_weight: float


class InstitutionalParamProvider:
    """Contrato para obtener parámetros DL-001."""

    def get_wyckoff_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> WyckoffParams:
        raise NotImplementedError

    def get_order_block_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> OrderBlockParams:
        raise NotImplementedError

    def get_liquidity_grab_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> LiquidityGrabParams:
        raise NotImplementedError

    def get_stop_hunting_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> StopHuntingParams:
        raise NotImplementedError

    def get_fvg_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> FairValueGapParams:
        raise NotImplementedError

    def get_microstructure_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> MicrostructureParams:
        raise NotImplementedError

    def get_vsa_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> "VsaParams":
        raise NotImplementedError

    def get_market_profile_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> "MarketProfileParams":
        raise NotImplementedError

    def get_order_flow_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> "OrderFlowParams":
        raise NotImplementedError

    def get_accumulation_distribution_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> "AccumulationDistributionParams":
        raise NotImplementedError

    def get_smc_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> "SmcParams":
        raise NotImplementedError

    def get_composite_man_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> "CompositeManParams":
        raise NotImplementedError


class DefaultInstitutionalParamProvider(InstitutionalParamProvider):
    """Implementación heurística inicial basada en BotConfig + estadísticas recientes."""

    def _risk_multiplier(self, bot_config: Any) -> float:
        profile = (getattr(bot_config, "risk_profile", "MODERATE") or "MODERATE").upper()
        return {
            "CONSERVATIVE": 0.85,
            "MODERATE": 1.0,
            "AGGRESSIVE": 1.15,
        }.get(profile, 1.0)

    def _volatility_factor(self, recent_stats: Dict[str, float]) -> float:
        atr = recent_stats.get("atr", 0) or 0
        price = recent_stats.get("last_price", 1) or 1
        atr_pct = atr / price if price else 0
        if atr_pct < 0.01:
            return 0.9
        if atr_pct > 0.03:
            return 1.15
        return 1.0

    def _cooldown_factor(self, bot_config: Any) -> float:
        cooldown = getattr(bot_config, "cooldown_minutes", 15) or 15
        if cooldown <= 5:
            return 0.9
        if cooldown >= 60:
            return 1.1
        return 1.0

    def get_wyckoff_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> WyckoffParams:
        risk = self._risk_multiplier(bot_config)
        vol = self._volatility_factor(recent_stats)
        min_bars = max(40, int(45 * vol))

        base_phase = int(30 * risk)
        phase_scores = {
            "accumulation": base_phase + 5,
            "markup": base_phase + 5,
            "distribution": base_phase,
            "markdown": base_phase,
            "neutral": max(15, int(15 * risk))
        }
        divergence_scores = {
            "accumulation": int(25 * risk),
            "distribution": int(22 * risk),
            "neutral": max(15, int(15 * risk)),
        }
        return WyckoffParams(
            min_bars=min_bars,
            phase_scores=phase_scores,
            price_change_threshold=0.02 * vol,
            volume_change_threshold=0.1 * risk,
            divergence_scores=divergence_scores,
            insufficient_score=max(10, int(10 * risk))
        )

    def get_order_block_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> OrderBlockParams:
        risk = self._risk_multiplier(bot_config)
        cooldown = self._cooldown_factor(bot_config)
        min_bars = int(30 * cooldown)
        return OrderBlockParams(
            min_bars=min_bars,
            volume_multiplier=1.15 * risk,
            retest_buffer=0.02 / risk,
            mixed_score=int(10 * risk),
            directional_bonus=int(20 * risk),
            neutral_score=int(5 * risk)
        )

    def get_liquidity_grab_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> LiquidityGrabParams:
        risk = self._risk_multiplier(bot_config)
        return LiquidityGrabParams(
            lookback=20,
            recent_window=10,
            spike_multiplier=1.4 * risk,
            volume_multiplier=1.2 * risk,
            high_activity_threshold=3,
            medium_activity_threshold=1
        )

    def get_stop_hunting_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> StopHuntingParams:
        risk = self._risk_multiplier(bot_config)
        return StopHuntingParams(
            min_bars=20,
            wick_multiplier=1.2 * risk,
            volume_ratio=1.1 * risk,
            lookback=15,
            recent_window=5
        )

    def get_fvg_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> FairValueGapParams:
        risk = self._risk_multiplier(bot_config)
        detection_ratio = 0.0015 * risk  # 0.15% baseline gap significance
        proximity_ratio = 0.02 * risk    # 2% price proximity window
        base_score = int(12 * risk)
        return FairValueGapParams(
            min_bars=20,
            detection_ratio=detection_ratio,
            proximity_ratio=proximity_ratio,
            mitigation_window=10,
            base_score=base_score,
            bonus_per_gap=int(6 * risk),
            max_bonus=int(30 * risk)
        )

    def get_microstructure_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> MicrostructureParams:
        risk = self._risk_multiplier(bot_config)
        vol = self._volatility_factor(recent_stats)
        return MicrostructureParams(
            structure_window=int(10 * vol),
            volume_window=int(20 * vol),
            imbalance_multiplier=1.5 * risk,
            concentration_high=0.32,
            concentration_medium=0.22,
            neutral_score=int(12 * risk)
        )

    def get_vsa_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> VsaParams:
        risk = self._risk_multiplier(bot_config)
        lookback = max(30, int(40 * risk))
        return VsaParams(
            lookback=lookback,
            high_volume_multiplier=1.6 * risk,
            ultra_volume_multiplier=2.4 * risk,
            narrow_spread_ratio=0.65 / risk,
            wide_spread_ratio=1.45 * risk,
            pattern_window=min(12, max(8, int(10 * risk)))
        )

    def get_market_profile_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> MarketProfileParams:
        risk = self._risk_multiplier(bot_config)
        vol = self._volatility_factor(recent_stats)
        lookback = max(60, int(80 * vol))
        return MarketProfileParams(
            lookback=lookback,
            value_area_ratio=0.7,
            imbalance_threshold=0.12 * risk,
            poc_window=int(lookback / 2)
        )

    def get_order_flow_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> OrderFlowParams:
        risk = self._risk_multiplier(bot_config)
        lookback = max(40, int(55 * risk))
        return OrderFlowParams(
            lookback=lookback,
            imbalance_threshold=0.18 * risk,
            delta_threshold=0.12 * risk,
            confirmation_window=min(12, max(6, int(8 * risk)))
        )

    def get_accumulation_distribution_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> AccumulationDistributionParams:
        risk = self._risk_multiplier(bot_config)
        lookback = max(50, int(65 * risk))
        return AccumulationDistributionParams(
            lookback=lookback,
            accumulation_threshold=0.15 * risk,
            distribution_threshold=-0.15 * risk,
            confirmation_window=min(14, max(8, int(10 * risk)))
        )

    def get_smc_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> SmcParams:
        risk = self._risk_multiplier(bot_config)
        return SmcParams(
            confirmation_threshold=4,
            smart_weight=1.2 * risk,
            trap_penalty=0.8 / risk,
            neutral_floor=0.4
        )

    def get_composite_man_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> CompositeManParams:
        risk = self._risk_multiplier(bot_config)
        return CompositeManParams(
            accumulation_min=4,
            distribution_min=4,
            neutral_min=3,
            emphasis_weight=1.1 * risk
        )
