"""Mode selection parameters and heuristic selector (Fase 3)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional
import math


@dataclass
class ModeSelectionContext:
    """Container for market context inputs."""
    bot_config: Any
    recent_stats: Dict[str, float]
    institutional_quality: Any
    institutional_confirmations: Dict[str, Any]
    algorithm_selection: Any
    multi_tf_signal: Any
    microstructure: Any
    current_mode: Optional[str] = None
    mode_duration: Optional[float] = None


class ModeParamProvider:
    """Interface for mode selection parameters (DL-001)."""

    def get_volatility_thresholds(self) -> Dict[str, float]:
        raise NotImplementedError

    def get_manipulation_weights(self) -> Dict[str, float]:
        raise NotImplementedError

    def get_trend_weights(self) -> Dict[str, float]:
        raise NotImplementedError

    def get_micro_weights(self) -> Dict[str, float]:
        raise NotImplementedError

    def get_mode_caps(self) -> Dict[str, float]:
        raise NotImplementedError

    def get_mode_floor(self, mode: str) -> float:
        raise NotImplementedError

    def get_sigmoid_params(self, mode: str) -> Dict[str, float]:
        raise NotImplementedError

    def get_performance_rules(self, mode: str) -> Dict[str, float]:
        raise NotImplementedError

    def get_selection_threshold(self) -> float:
        raise NotImplementedError

    def get_selection_margin(self) -> float:
        raise NotImplementedError

    def get_min_mode_duration(self) -> float:
        raise NotImplementedError

    def get_default_mode(self) -> str:
        raise NotImplementedError

    def get_emergency_override(self) -> float:
        raise NotImplementedError


class DefaultModeParamProvider(ModeParamProvider):
    """Heuristic parameters derived from BotConfig + recent stats."""

    def __init__(self, bot_config: Any, recent_stats: Dict[str, float]):
        self.bot_config = bot_config
        self.recent_stats = recent_stats or {}
        self._risk = self._risk_multiplier()

    def _risk_multiplier(self) -> float:
        profile = (getattr(self.bot_config, "risk_profile", "MODERATE") or "MODERATE").upper()
        return {
            "CONSERVATIVE": 0.85,
            "MODERATE": 1.0,
            "AGGRESSIVE": 1.15,
        }.get(profile, 1.0)

    def get_volatility_thresholds(self) -> Dict[str, float]:
        atr_pct = self.recent_stats.get("atr_pct", 0.02) or 0.02
        base_high = atr_pct * (1.1 + (self._risk - 1.0) * 0.5)
        return {
            "high": base_high,
            "extreme": base_high * 1.4,
            "score_extreme": min(1.0, atr_pct / (base_high * 1.3)),
            "score_high": min(0.8, atr_pct / (base_high * 1.1)),
            "score_trending": 0.55 * self._risk,
            "score_default": 0.35 * self._risk
        }

    def get_manipulation_weights(self) -> Dict[str, float]:
        return {
            "stop_hunt": 0.25 * self._risk,
            "liquidity": 0.22,
            "composite_man": 0.28,
            "order_flow": 0.15 * self._risk,
            "vsa": 0.10
        }

    def get_trend_weights(self) -> Dict[str, float]:
        leverage = getattr(self.bot_config, "leverage", 1) or 1
        return {
            "alignment": 0.35,
            "smc": 0.25 * self._risk,
            "volume": 0.18,
            "breakout": 0.12,
            "regime": 0.10 * min(leverage / 5, 1.2)
        }

    def get_micro_weights(self) -> Dict[str, float]:
        return {
            "poc": 0.4,
            "vah_val": 0.25,
            "flow": 0.25,
            "liquidity": 0.10
        }

    def get_mode_caps(self) -> Dict[str, float]:
        return {
            "ANTI_MANIPULATION": 0.9,
            "VOLATILITY_ADAPTIVE": 0.85,
            "NEWS_SENTIMENT": 0.75,
            "TREND_FOLLOWING": 0.88,
            "SCALPING": 1.0
        }

    def get_mode_floor(self, mode: str) -> float:
        return {
            "SCALPING": 0.25,
            "TREND_FOLLOWING": 0.10,
            "ANTI_MANIPULATION": 0.10,
            "VOLATILITY_ADAPTIVE": 0.08,
            "NEWS_SENTIMENT": 0.05
        }.get(mode, 0.0)

    def get_sigmoid_params(self, mode: str) -> Dict[str, float]:
        base = {
            "TREND_FOLLOWING": {"mid": 0.55, "steep": 8.0},
            "ANTI_MANIPULATION": {"mid": 0.5, "steep": 9.0},
            "VOLATILITY_ADAPTIVE": {"mid": 0.45, "steep": 7.0},
            "NEWS_SENTIMENT": {"mid": 0.5, "steep": 6.0},
        }.get(mode, {"mid": 0.5, "steep": 7.5})
        base["steep"] *= self._risk
        return base

    def get_performance_rules(self, mode: str) -> Dict[str, float]:
        base = {
            "lookback_days": 5 + int((1 / self._risk) * 2),
            "boost_win_rate": 0.58,
            "boost_pf": 1.3,
            "boost_weight": 1.15,
            "penalty_win_rate": 0.42,
            "penalty_pf": 0.9,
            "penalty_weight": 0.85,
            "neutral_weight": 1.0
        }
        if mode == "SCALPING":
            base.update({"boost_win_rate": 0.6, "boost_weight": 1.2})
        if mode == "TREND_FOLLOWING":
            base.update({"lookback_days": 7, "boost_pf": 1.4})
        return base

    def get_selection_threshold(self) -> float:
        return 0.55 * self._risk

    def get_selection_margin(self) -> float:
        return 0.07

    def get_min_mode_duration(self) -> float:
        cooldown = getattr(self.bot_config, "cooldown_minutes", 15) or 15
        return max(5.0, cooldown / 3)

    def get_default_mode(self) -> str:
        return "SCALPING"

    def get_emergency_override(self) -> float:
        return 0.85


class IntelligentModeSelector:
    """Heuristic selector using institutional signals (Phase 3)."""

    def __init__(self, param_provider: ModeParamProvider):
        self.params = param_provider
        self.current_mode = self.params.get_default_mode()
        self.current_mode_duration = self.params.get_min_mode_duration()

    def _sigmoid(self, value: float, config: Dict[str, float]) -> float:
        mid = config.get("mid", 0.5)
        steep = config.get("steep", 7.0)
        return 1 / (1 + math.exp(-steep * (value - mid)))

    def _compute_manipulation_score(self, ctx: ModeSelectionContext) -> float:
        weights = self.params.get_manipulation_weights()
        confirmations = ctx.institutional_confirmations
        def score_for(key: str) -> float:
            conf = confirmations.get(key)
            if not conf:
                return 0.0
            bias = 1.0 if conf.bias == "SMART_MONEY" else 0.7 if conf.bias == "INSTITUTIONAL_NEUTRAL" else 0.3
            return (conf.score / 100.0) * bias
        score = 0.0
        score += score_for("stop_hunting") * weights.get("stop_hunt", 0.2)
        score += score_for("liquidity_grabs") * weights.get("liquidity", 0.2)
        score += score_for("composite_man") * weights.get("composite_man", 0.2)
        score += score_for("institutional_order_flow") * weights.get("order_flow", 0.2)
        score += score_for("volume_spread_analysis") * weights.get("vsa", 0.1)
        alerts_penalty = len(ctx.institutional_quality.manipulation_alerts)
        if alerts_penalty:
            score += 0.05 * min(alerts_penalty, 3)
        return min(score, 1.0)

    def _compute_volatility_score(self, ctx: ModeSelectionContext) -> float:
        thresholds = self.params.get_volatility_thresholds()
        atr_pct = ctx.recent_stats.get("atr_pct", 0.02)
        vol_percentile = ctx.recent_stats.get("volatility_percentile", atr_pct / max(thresholds["high"], 1e-6))
        if atr_pct >= thresholds["extreme"]:
            return thresholds["score_extreme"]
        if atr_pct >= thresholds["high"]:
            return thresholds["score_high"]
        if vol_percentile >= 1.0:
            return thresholds["score_trending"]
        return thresholds["score_default"]

    def _compute_trend_score(self, ctx: ModeSelectionContext) -> float:
        weights = self.params.get_trend_weights()
        score = 0.0
        alignment = getattr(ctx.multi_tf_signal, "alignment", None)
        if alignment:
            align_map = {
                "BULLISH": 1.0,
                "BEARISH": 1.0,
                "NEUTRAL": 0.4,
                "MIXED": 0.6
            }
            score += align_map.get(alignment.value if hasattr(alignment, "value") else str(alignment), 0.5) * weights.get("alignment", 0.3)
        regime = ctx.algorithm_selection.market_regime.value if hasattr(ctx.algorithm_selection.market_regime, "value") else str(ctx.algorithm_selection.market_regime)
        if "TREND" in regime.upper():
            score += 0.3 * weights.get("regime", 0.1)
        smc_conf = ctx.institutional_confirmations.get("smart_money_concepts")
        if smc_conf:
            score += (smc_conf.score / 100.0) * weights.get("smc", 0.25)
        vsa_conf = ctx.institutional_confirmations.get("volume_spread_analysis")
        if vsa_conf and vsa_conf.bias == "SMART_MONEY":
            score += 0.2 * weights.get("volume", 0.18)
        breakout_strength = getattr(ctx.multi_tf_signal, "trend_strength", None)
        if breakout_strength:
            trend_val = breakout_strength.value if hasattr(breakout_strength, "value") else breakout_strength
            map_strength = {
                "STRONG": 0.9,
                "MEDIUM": 0.7,
                "WEAK": 0.4
            }
            score += map_strength.get(trend_val, 0.5) * weights.get("breakout", 0.12)
        return min(score, 1.0)

    def _compute_micro_score(self, ctx: ModeSelectionContext) -> float:
        weights = self.params.get_micro_weights()
        micro = ctx.institutional_confirmations.get("market_profile")
        microstructure = ctx.microstructure
        score = 0.0
        if micro:
            context = micro.details.get("context", "") if micro.details else ""
            if "Value Area Low" in context:
                score += 0.6 * weights.get("poc", 0.4)
            if "Value Area High" in context and micro.bias == "RETAIL_TRAP":
                score += 0.3 * weights.get("vah_val", 0.25)
        flow = ctx.institutional_confirmations.get("institutional_order_flow")
        if flow:
            score += abs(flow.details.get("imbalance", 0.0)) * weights.get("flow", 0.25)
        if hasattr(microstructure, "dominant_side"):
            dom = microstructure.dominant_side.value if hasattr(microstructure.dominant_side, "value") else str(microstructure.dominant_side)
            if dom.upper() in {"BUYERS", "ACCUMULATION"}:
                score += 0.3 * weights.get("liquidity", 0.1)
        return min(score, 1.0)

    def _compute_news_score(self, ctx: ModeSelectionContext) -> float:
        # Placeholder: until news pipeline arrives, estimate from institutional alerts
        alerts = len(ctx.institutional_quality.manipulation_alerts)
        high_vol = ctx.recent_stats.get("atr_pct", 0.02) > 0.035
        return min(1.0, 0.15 + 0.1 * alerts + (0.1 if high_vol else 0))

    def _apply_caps(self, scores: Dict[str, float]) -> Dict[str, float]:
        caps = self.params.get_mode_caps()
        return {mode: min(score, caps.get(mode, 1.0)) for mode, score in scores.items()}

    def _apply_performance_weighting(self, scores: Dict[str, float]) -> Dict[str, float]:
        weighted = {}
        for mode, score in scores.items():
            rules = self.params.get_performance_rules(mode)
            weighted[mode] = score * rules.get("neutral_weight", 1.0)
        return weighted

    def _select_mode(self, weighted: Dict[str, float], ctx: ModeSelectionContext) -> Dict[str, Any]:
        threshold = self.params.get_selection_threshold()
        margin = self.params.get_selection_margin()
        sorted_modes = sorted(weighted.items(), key=lambda x: x[1], reverse=True)
        best_mode, best_score = sorted_modes[0]
        second_score = sorted_modes[1][1] if len(sorted_modes) > 1 else 0.0

        current_mode = ctx.current_mode or self.current_mode
        current_duration = ctx.mode_duration if ctx.mode_duration is not None else self.params.get_min_mode_duration()

        if best_score < threshold:
            selected = self.params.get_default_mode()
            remaining = self.params.get_min_mode_duration()
        elif (best_score - second_score) < margin and current_mode == best_mode and current_duration > 0:
            selected = current_mode
            remaining = max(current_duration - 1, 0)
        else:
            selected = best_mode
            remaining = self.params.get_min_mode_duration()

        self.current_mode = selected
        self.current_mode_duration = remaining
        return {
            "selected": selected,
            "confidence": round(best_score, 3),
            "scores": {mode: round(score, 3) for mode, score in weighted.items()},
            "remaining_duration": remaining
        }

    def select_mode(self, ctx: ModeSelectionContext) -> Dict[str, Any]:
        if ctx.current_mode:
            self.current_mode = ctx.current_mode
        if ctx.mode_duration is not None:
            self.current_mode_duration = ctx.mode_duration

        volatility = self._compute_volatility_score(ctx)
        manipulation = self._compute_manipulation_score(ctx)
        trend = self._compute_trend_score(ctx)
        micro = self._compute_micro_score(ctx)
        news = self._compute_news_score(ctx)

        raw_scores = {
            "ANTI_MANIPULATION": manipulation,
            "VOLATILITY_ADAPTIVE": self._sigmoid(volatility, self.params.get_sigmoid_params("VOLATILITY_ADAPTIVE")),
            "NEWS_SENTIMENT": self._sigmoid(news, self.params.get_sigmoid_params("NEWS_SENTIMENT")),
            "TREND_FOLLOWING": self._sigmoid(trend, self.params.get_sigmoid_params("TREND_FOLLOWING"))
        }
        floor = self.params.get_mode_floor("SCALPING")
        raw_scores["SCALPING"] = max(floor, 1.0 - max(raw_scores.values()))

        capped = self._apply_caps(raw_scores)
        weighted = self._apply_performance_weighting(capped)
        decision = self._select_mode(weighted, ctx)
        decision["features"] = {
            "volatility": round(volatility, 3),
            "manipulation": round(manipulation, 3),
            "trend": round(trend, 3),
            "microstructure": round(micro, 3),
            "news": round(news, 3)
        }
        decision["params"] = {
            "threshold": self.params.get_selection_threshold(),
            "margin": self.params.get_selection_margin()
        }
        return decision
