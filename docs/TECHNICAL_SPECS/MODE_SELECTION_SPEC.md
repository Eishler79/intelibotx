# MODE_SELECTION_SPEC.md — AI Mode Selection (DL-001)

> **BRAIN SYSTEM:** Advanced AI that selects the optimal operating mode in real time by analysing market regime, volatility, news and manipulation patterns. All weights and thresholds come from `ModeParamProvider`; no literals in implementation.

---

## Architecture Overview

```python
class IntelligentModeSelector:
    def __init__(self, mode_params: ModeParamProvider):
        self.market_analyzer = RealTimeMarketAnalyzer(mode_params)
        self.pattern_classifier = PatternClassificationML(mode_params)
        self.mode_predictor = ModeOptimalityPredictor(mode_params)
        self.performance_tracker = ModePerformanceML(mode_params)
        self.learning_engine = ContinuousLearningEngine(mode_params)
        self.mode_params = mode_params

    def select_optimal_mode(self, current_market_data):
        features = self.extract_market_features(current_market_data, self.mode_params)
        raw_probs = self.predict_mode_probabilities(features, self.mode_params)
        weighted = self.apply_performance_weighting(raw_probs, self.mode_params)
        return self.select_with_confidence(weighted, self.mode_params)
```

---

## Feature Extraction (DL-001)

```python
def extract_market_features(self, market_data, mode_params):
    features = {}
    features['volatility'] = {
        'current_atr': market_data.atr_pct,
        'percentile': market_data.volatility_percentile,
        'trend': market_data.volatility_trend,
        'intraday_range': market_data.intraday_range,
        'volume_volatility': market_data.volume_cv,
        'thresholds': mode_params.get_volatility_thresholds()
    }
    features['manipulation'] = {
        'stop_hunt_prob': self.calc_stop_hunt_prob(market_data),
        'liquidity_risk': self.calc_liquidity_risk(market_data),
        'composite_man': self.detect_composite_man(market_data),
        'order_flow_anomaly': self.analyse_order_flow(market_data),
        'false_breakout_risk': self.calc_false_breakout(market_data),
        'weights': mode_params.get_manipulation_weights()
    }
    features['news'] = {
        'upcoming_score': self.upcoming_news_score(),
        'residual_score': self.recent_news_residual(),
        'cb_sentiment': self.cb_sentiment(),
        'regulatory': self.regulatory_score(),
        'market_sentiment': self.aggregate_sentiment(),
        'weights': mode_params.get_news_weights()
    }
    features['trend'] = {
        'institutional_strength': self.trend_strength(market_data),
        'smc_quality': self.smc_structure_quality(market_data),
        'mtf_alignment': self.mtf_alignment(market_data),
        'volume_confirmation': self.volume_trend_confirmation(market_data),
        'breakout_quality': self.breakout_quality(market_data),
        'weights': mode_params.get_trend_weights()
    }
    features['microstructure'] = {
        'bid_ask_imbalance': market_data.bid_ask_imbalance,
        'order_book_depth': market_data.order_book_depth,
        'institutional_flow': market_data.institutional_flow,
        'retail_positioning': market_data.retail_positioning,
        'liquidity_distribution': market_data.liquidity_distribution,
        'weights': mode_params.get_micro_weights()
    }
    return features
```

---

## Mode Probability Estimation

```python
def predict_mode_probabilities(self, features, mode_params):
    probs = {}
    probs['ANTI_MANIPULATION'] = min(
        self.manipulation_score(features['manipulation']),
        mode_params.get_mode_caps()['ANTI_MANIPULATION']
    )
    probs['VOLATILITY_ADAPTIVE'] = self.sigmoid(
        self.volatility_score(features['volatility']),
        mode_params.get_sigmoid_params('VOLATILITY_ADAPTIVE')
    )
    probs['NEWS_SENTIMENT'] = self.sigmoid(
        self.news_score(features['news']),
        mode_params.get_sigmoid_params('NEWS_SENTIMENT')
    )
    probs['TREND_FOLLOWING'] = self.sigmoid(
        self.trend_score(features['trend']),
        mode_params.get_sigmoid_params('TREND_FOLLOWING')
    )
    floor = mode_params.get_mode_floor('SCALPING')
    probs['SCALPING'] = max(floor, 1.0 - max(probs.values()))
    return probs
```

Scoring helpers use provider weights/thresholds:
```python
def manipulation_score(self, manipulation):
    w = manipulation['weights']
    score = 0.0
    score += manipulation['stop_hunt_prob'] * w['stop_hunt']
    score += manipulation['liquidity_risk'] * w['liquidity']
    score += manipulation['composite_man'] * w['composite_man']
    score += manipulation['order_flow_anomaly'] * w['order_flow']
    return min(score, 1.0)

def volatility_score(self, volatility):
    t = volatility['thresholds']
    if volatility['current_atr'] > t['extreme']:
        return t['score_extreme']
    if volatility['current_atr'] > t['high']:
        return t['score_high']
    if volatility['trend'] == 'INCREASING':
        return t['score_trending']
    return t['score_default']
```

---

## Performance Weighting & Hysteresis

```python
def apply_performance_weighting(self, probs, mode_params):
    weights = {}
    for mode in probs:
        rules = mode_params.get_performance_rules(mode)
        perf = self.performance_tracker.get_recent_performance(
            mode, days=rules['lookback_days']
        )
        if perf['win_rate'] > rules['boost_win_rate'] and perf['profit_factor'] > rules['boost_pf']:
            weights[mode] = rules['boost_weight']
        elif perf['win_rate'] < rules['penalty_win_rate'] or perf['profit_factor'] < rules['penalty_pf']:
            weights[mode] = rules['penalty_weight']
        else:
            weights[mode] = rules['neutral_weight']
    return {mode: probs[mode] * weights[mode] for mode in probs}

def select_with_confidence(self, weighted, mode_params):
    threshold = mode_params.get_selection_threshold()
    margin = mode_params.get_selection_margin()
    sorted_modes = sorted(weighted.items(), key=lambda x: x[1], reverse=True)
    best_mode, best_score = sorted_modes[0]
    second_score = sorted_modes[1][1] if len(sorted_modes) > 1 else 0.0
    if best_score < threshold:
        return mode_params.get_default_mode()
    if best_score - second_score < margin and self.current_mode_duration < mode_params.get_min_mode_duration():
        return self.current_mode  # hysteresis
    return best_mode
```

All hysteresis values (`threshold`, `margin`, `min_mode_duration`, `default_mode`) come from the provider.

---

## ModeParamProvider Contract

```python
class ModeParamProvider(Protocol):
    def get_volatility_thresholds(self) -> Dict[str, float]: ...
    def get_manipulation_weights(self) -> Dict[str, float]: ...
    def get_news_weights(self) -> Dict[str, float]: ...
    def get_trend_weights(self) -> Dict[str, float]: ...
    def get_micro_weights(self) -> Dict[str, float]: ...
    def get_regime_weights(self) -> Dict[str, float]: ...
    def get_sigmoid_params(self, mode: str) -> Dict[str, float]: ...
    def get_mode_caps(self) -> Dict[str, float]: ...
    def get_mode_floor(self, mode: str) -> float: ...
    def get_performance_rules(self, mode: str) -> Dict[str, float]: ...
    def get_selection_threshold(self) -> float: ...
    def get_selection_margin(self) -> float: ...
    def get_min_mode_duration(self) -> float: ...
    def get_default_mode(self) -> str: ...
```

Implementation examples must read from `BotConfig` (strategy, risk_profile, TP/SL, leverage, cooldown, interval), `recent_stats` (ATR, volatility percentiles) and `symbol_meta` (tick/step).

---

## Outputs & Integration

- Endpoint: reuse `POST /api/run-smart-trade/{symbol}`. Selected mode is reported in `analysis.mode` (future enhancement) along with confidence, reasons and gating features.
- Payload additions (conceptual):
  ```json
  "mode_decision": {
    "selected": "TREND_FOLLOWING",
    "confidence": 0.82,
    "scores": {
      "SCALPING": 0.34,
      "TREND_FOLLOWING": 0.82,
      "ANTI_MANIPULATION": 0.41,
      "VOLATILITY_ADAPTIVE": 0.27,
      "NEWS_SENTIMENT": 0.19
    },
    "features": {
      "volatility": {...},
      "manipulation": {...},
      "news": {...},
      "trend": {...},
      "microstructure": {...}
    }
  }
  ```
- No data simulation in UI; if mode decision is unavailable, display neutral state.

---

## Testing & Compliance

- Validate behaviour across market regimes (normal, high volatility, high manipulation, news events, trending markets).
- Ensure thresholds/weights match provider values per strategy (Smart Scalper vs Trend Hunter vs others).
- Monitor performance feedback loop (win rate, PF, drawdown per mode).

---

## Rollback (P2)

This document affects specification only. To revert changes:
`git restore docs/TECHNICAL_SPECS/MODE_SELECTION_SPEC.md`
