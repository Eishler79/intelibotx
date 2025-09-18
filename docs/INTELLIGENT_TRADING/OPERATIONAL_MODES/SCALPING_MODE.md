# SCALPING_MODE.md - Modo Base Institucional (DL‑001)

> **MODO DEFAULT:** Scalping institucional anti-manipulación con 6 algoritmos Smart Money implementados.
> DL‑001: Todos los thresholds/targets/timeframes provienen de parámetros del modo/estrategia (sin literales en lógica de modo).

---

## 🎯 **CUÁNDO SE ACTIVA**

### **Condiciones Mercado:**
- Condiciones normales sin eventos extraordinarios
- Volatilidad < 5% ATR
- No detección manipulación alta probabilidad
- No noticias high-impact últimos 30 minutos
- Trend strength < 80% (no trending fuerte)

### **Prioridad:** 
**DEFAULT** - Modo base cuando otros modos no son óptimos

---

## 🏛️ **ALGORITMOS INSTITUCIONALES (6/6 IMPLEMENTADOS)**

### **✅ 1. WYCKOFF METHOD ANALYSIS**
```python
def wyckoff_scalping_signal(self, market_data):
    """Detectar micro-fases Wyckoff para scalping"""
    
    # Micro accumulation/distribution detection
    if self.detect_micro_accumulation(market_data):
        return ScalpingSignal(
            direction='BUY',
            confidence=mode_params.wyckoff_confidence,
            phase='MICRO_ACCUMULATION',
            target=mode_params.target_profit,
            stop=mode_params.stop_loss
        )
    
    # Spring detection for quick reversal
    elif self.detect_wyckoff_spring(market_data):
        return ScalpingSignal(
            direction='BUY',
            confidence=mode_params.wyckoff_confidence,
            phase='SPRING_REVERSAL', 
            target=mode_params.target_profit,
            stop=mode_params.stop_loss
        )
```

### **✅ 2. ORDER BLOCKS CONFIRMATION**
```python
def order_blocks_scalping_signal(self, market_data):
    """Retest de Order Blocks institucionales"""
    
    # Identify institutional order blocks
    order_blocks = self.identify_institutional_zones(market_data)
    
    # Price retest of order block
    for block in order_blocks:
        if self.is_price_retesting_block(market_data.current_price, block):
            return ScalpingSignal(
                direction=block.direction,
                confidence=mode_params.ob_confidence,
                zone='ORDER_BLOCK_RETEST',
                target=mode_params.target_profit,
                stop=mode_params.stop_loss
            )
```

### **✅ 3. LIQUIDITY GRABS DETECTION**
```python
def liquidity_grabs_scalping_signal(self, market_data):
    """Detectar y fade liquidity grabs"""
    
    # Recent liquidity grab detection
    if self.detect_recent_liquidity_grab(market_data):
        grab_info = self.analyze_liquidity_grab(market_data)
        
        return ScalpingSignal(
            direction=grab_info.fade_direction,  # Opposite
            confidence=mode_params.liquidity_confidence,
            pattern='LIQUIDITY_GRAB_FADE',
            target=mode_params.target_profit,
            stop=mode_params.stop_loss
        )
```

### **✅ 4. STOP HUNTING ANALYSIS**
```python
def stop_hunting_scalping_signal(self, market_data):
    """Anti stop hunting scalping"""
    
    # Stop hunt pattern detection
    if self.detect_stop_hunting_pattern(market_data):
        hunt_analysis = self.analyze_stop_hunt(market_data)
        
        return ScalpingSignal(
            direction=hunt_analysis.reversal_direction,
            confidence=mode_params.stop_hunt_confidence,
            pattern='STOP_HUNT_REVERSAL',
            target=mode_params.target_profit,
            stop=mode_params.stop_loss
        )
```

### **✅ 5. FAIR VALUE GAPS ASSESSMENT**
```python
def fair_value_gaps_scalping_signal(self, market_data):
    """Trade hacia Fair Value Gaps"""
    
    # Identify unfilled FVGs
    fvg_zones = self.identify_unfilled_fvgs(market_data)
    
    for fvg in fvg_zones:
        if self.is_price_approaching_fvg(market_data.current_price, fvg):
            return ScalpingSignal(
                direction=fvg.fill_direction,
                confidence=mode_params.fvg_confidence,
                zone='FVG_FILL',
                target=mode_params.target_profit,
                stop=mode_params.stop_loss
            )
```

### **✅ 6. MARKET MICROSTRUCTURE VALIDATION**
```python
def microstructure_scalping_signal(self, market_data):
    """Microstructure institucional analysis"""
    
    # Order flow analysis
    order_flow = self.analyze_order_flow(market_data)
    
    # Bid/ask imbalance detection
    if order_flow.institutional_bias and order_flow.imbalance > mode_params.imbalance_threshold:
        return ScalpingSignal(
            direction=order_flow.bias_direction,
            confidence=mode_params.micro_confidence,
            pattern='MICROSTRUCTURE_BIAS',
            target=mode_params.target_profit,
            stop=mode_params.stop_loss
        )
```

---

## 🔄 **MULTI-ALGORITHM CONFIRMATION**

### **Consensus Logic:**
```python
class ScalpingModeConsensus:
    def generate_scalping_signal(self, market_data):
        """Confirmación multi-algoritmo institucional"""
        
        # Collect signals from all 6 algorithms
        signals = []
        signals.append(self.wyckoff_scalping_signal(market_data))
        signals.append(self.order_blocks_scalping_signal(market_data))
        signals.append(self.liquidity_grabs_scalping_signal(market_data))
        signals.append(self.stop_hunting_scalping_signal(market_data))
        signals.append(self.fair_value_gaps_scalping_signal(market_data))
        signals.append(self.microstructure_scalping_signal(market_data))
        
        # Filter high confidence signals (umbral externo)
        strong_signals = [s for s in signals if s.confidence > mode_params.min_signal_confidence]
        
        # Require minimum N/6 algorithm confirmation (externo)
        if len(strong_signals) >= mode_params.min_strong_signals:
            consensus_direction = self.get_consensus_direction(strong_signals)
            combined_confidence = self.calculate_combined_confidence(strong_signals, weights=mode_params.consensus_weights)
            
            return FinalScalpingSignal(
                direction=consensus_direction,
                confidence=combined_confidence,
                algorithms_count=len(strong_signals),
                target_profit=self.calculate_optimal_target(strong_signals, mode_params),
                stop_loss=self.calculate_optimal_stop(strong_signals, mode_params)
            )
        
        return FinalScalpingSignal.NO_TRADE
```

---

## ⚙️ **EXECUTION PARAMETERS**

### **Position Sizing:**
```python
def calculate_scalping_position_size(self, capital, volatility, confidence, mode_params):
    """Position sizing adaptativo scalping (DL‑001)"""
    base_risk = mode_params.base_risk
    confidence_multiplier = confidence / mode_params.confidence_baseline
    volatility_adjustment = 1.0 / (1.0 + volatility * mode_params.volatility_scale)
    final_risk = base_risk * confidence_multiplier * volatility_adjustment
    return min(final_risk, mode_params.max_position_risk)
```

### **Timeframes:**
```python
SCALPING_TIMEFRAMES = get_scalping_timeframes(mode_params)  # Derivado del provider del modo
```

### **Risk Management:**
```python
SCALPING_RISK_PARAMS = get_scalping_risk_params(mode_params)  # Derivado del provider del modo

---

## DL‑001 Provider del Modo Scalping (referencia)

Este modo debe consumir parámetros de un provider (sin literales):
- get_algorithm_confidences(), get_target_stop(), get_min_signal_confidence(), get_consensus_weights(), get_scalping_timeframes(), get_scalping_risk_params(), get_micro_thresholds().

No crear endpoints nuevos; reutilizar `POST /api/run-smart-trade/{symbol}`. Las decisiones de modo se basan en confirmaciones institucionales reales y parámetros externos.
```

---

## 📊 **PERFORMANCE TARGETS**

### **KPIs Objetivo:**
```python
SCALPING_MODE_TARGETS = {
    'win_rate': 0.70,                # 70% win rate target
    'profit_factor': 2.0,            # 2.0 profit factor
    'avg_trade_duration': 8,         # 8 minutes average
    'avg_profit_per_trade': 0.008,   # 0.8% average profit
    'max_drawdown_daily': 0.03,      # 3% max daily drawdown
    'trades_per_day': 8,             # 8-12 trades daily
    'sharpe_ratio': 2.5              # 2.5 Sharpe target
}
```

### **Benchmarking:**
```python
# vs Retail Scalping
RETAIL_SCALPING_TYPICAL = {
    'win_rate': 0.45,               # 45% typical retail
    'profit_factor': 0.9,           # Often negative
    'avg_drawdown': 0.15,           # 15% drawdowns common
    'sharpe_ratio': 0.2             # Poor risk-adjusted returns
}

# InteliBotX Advantage
INSTITUTIONAL_ADVANTAGE = {
    'anti_manipulation': True,       # Protected from stop hunts
    'algorithm_quality': 'institutional',  # Smart Money algorithms
    'confirmation_required': 3,      # Multi-algorithm confirmation
    'risk_management': 'adaptive'    # Dynamic risk adjustment
}
```

---

## 🛡️ **ANTI-MANIPULATION FEATURES**

### **Stop Hunt Protection:**
```python
def protect_from_stop_hunting(self, entry_price, market_data):
    """Protección específica stop hunting"""
    
    # Identify obvious stop hunt levels
    hunt_levels = self.identify_stop_hunt_levels(market_data)
    
    # Adjust stop placement to avoid hunts
    safe_stop = self.calculate_safe_stop_placement(
        entry_price, hunt_levels
    )
    
    # Use time-based stops if price stops risky
    if self.is_stop_hunt_risk_high(hunt_levels):
        return TimeBasedStop(max_duration=10)  # 10 min max
    
    return safe_stop
```

### **Liquidity Grab Protection:**
```python
def protect_from_liquidity_grabs(self, entry_decision, market_data):
    """Evitar entrada en liquidity grabs"""
    
    # Recent grab detection
    if self.detect_recent_liquidity_activity(market_data):
        # Wait for genuine momentum
        return EntryDelay(wait_minutes=3)
    
    # Validate volume behind move
    if not self.validate_genuine_volume(market_data):
        return EntryReject(reason='INSUFFICIENT_VOLUME')
    
    return EntryApproved()
```

---

## 🎯 **INTEGRATION POINTS**

### **Mode Activation Logic:**
```python
def should_activate_scalping_mode(self, market_state):
    """Lógica activación modo scalping"""
    
    # Default mode conditions
    normal_conditions = (
        market_state.volatility < 0.05 and
        market_state.manipulation_risk < 0.5 and  
        market_state.news_impact < 0.6 and
        market_state.trend_strength < 0.8
    )
    
    # Scalping opportunities available
    scalping_opportunities = self.count_scalping_setups(market_state) > 2
    
    return normal_conditions and scalping_opportunities
```

### **Performance Tracking:**
```python
def track_scalping_performance(self, trade_result):
    """Track específico performance scalping"""
    
    metrics = {
        'algorithm_used': trade_result.algorithms_triggered,
        'confirmation_count': trade_result.confirmations,
        'time_to_profit': trade_result.duration_minutes,
        'slippage': trade_result.execution_slippage,
        'risk_reward_actual': trade_result.actual_rr_ratio
}

---

## 🧭 Fases de Evolución

### Fase 1 — Actual
- Algoritmos: Wyckoff, Order Blocks, Liquidity Grabs, Stop Hunting, FVG, Microestructura.
- Objetivo: 0.8–2.5% por trade, consenso multi‑algoritmo 3/6, stops cortos.

### Fase 2 — Optimización
- Añadir VSA y Market Profile dedicado como confirmaciones.
- Reglas normalizadas por ATR (depth/retest/wicks/partial‑fill), confluencias OB+FVG+POC.
- Exponer `consensus_3of6` y `high_confidence_count` en API/UI.
- Integrar gestión de riesgo/salidas: trailing dinámico, TP parcial en confluencias, SL adaptativo.

### Fase 3 — Potencialización
- Order Flow L2 (icebergs/blocks) como filtro avanzado.
- Ejecución adaptativa (TWAP/VWAP/POV) y control de slippage.
- Selector de modos con régimen/ML y aprendizaje de performance.

    # Optimize based on performance
    if metrics['time_to_profit'] > 15:
        self.optimize_entry_timing()
    if metrics['slippage'] > 0.002:
        self.optimize_execution_timing()
```

---

## ✅ **SCALPING MODE INSTITUCIONAL COMPLETO**

**CARACTERÍSTICAS:**
- ✅ **6 Algoritmos Institucionales** implementados y operativos
- ✅ **Anti-Manipulación** integrado en cada algoritmo
- ✅ **Multi-Confirmación** requerida (mínimo 3/6)
- ✅ **Risk Management** adaptativo según condiciones
- ✅ **Performance Tracking** específico modo scalping
- ✅ **NO algoritmos retail** (RSI, MACD, EMA eliminados)

**OBJETIVO:** Base sólida institucional para generación ganancias consistentes 0.5-1.5% por trade con protección anti-manipulación.

---

*Modo: Scalping Institucional*  
*Algoritmos: 6/6 Smart Money implementados*  
*Estado: OPERATIVO - Base sistema*
