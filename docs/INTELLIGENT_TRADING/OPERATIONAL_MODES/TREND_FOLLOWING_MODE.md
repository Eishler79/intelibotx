# TREND_FOLLOWING_MODE.md - Modo Tendencias Institucional (DL‑001)

> **SMC + Market Profile + VSA:** Seguimiento tendencias usando Smart Money Concepts, Market Profile y Volume Spread Analysis institucional.
> DL‑001: Todos los thresholds/targets/timeframes provienen de parámetros de estrategia/bot (sin literales en lógica de modo).

---

## 🎯 **CUÁNDO SE ACTIVA**

### **Condiciones Mercado:**
- Institutional trend strength > 80%
- Multiple timeframe alignment (15m, 1h, 4h)
- Volume expansion > 150% average
- Break of Structure (BOS) confirmado
- POC (Point of Control) breakout validado

### **Prioridad:** 
**ALTA** - Cuando trending institucional confirmado

---

## 🏛️ **ALGORITMOS INSTITUCIONALES (3 CORE)**

### **🎯 1. SMART MONEY CONCEPTS (SMC)**
```python
def smc_trend_signal(self, market_data):
    """Break of Structure + Change of Character analysis"""
    
    # Break of Structure detection
    bos_analysis = self.detect_break_of_structure(market_data)
    
    if bos_analysis.valid_bos:
        # Change of Character confirmation
        choch_confirmation = self.detect_change_of_character(market_data)
        
        if choch_confirmation.confirmed:
            return TrendSignal(
                direction=bos_analysis.direction,
                confidence=mode_params.smc_confidence,
                pattern='BOS_CHOCH_CONFIRMED',
                structure_level=bos_analysis.break_level,
                target=self.calculate_structure_target(bos_analysis, mode_params),
                stop=self.calculate_structure_stop(bos_analysis, mode_params)
            )
    
    # Inducement detection (fake breakout)
    inducement = self.detect_inducement(market_data)
    if inducement.detected:
        return TrendSignal(
            direction=inducement.fade_direction,
            confidence=mode_params.inducement_confidence,
            pattern='INDUCEMENT_FADE',
            target=mode_params.target_profit,
            stop=mode_params.stop_loss
        )
```

### **📊 2. MARKET PROFILE ANALYSIS**
```python
def market_profile_trend_signal(self, market_data):
    """POC, VAH, VAL institutional analysis"""
    
    # Point of Control breakout
    poc_analysis = self.analyze_poc_breakout(market_data)
    
    if poc_analysis.valid_breakout:
        # Value Area analysis
        va_analysis = self.analyze_value_area_break(market_data)
        
        return TrendSignal(
            direction=poc_analysis.direction,
            confidence=mode_params.profile_confidence,
            pattern='POC_BREAKOUT_CONFIRMED',
            poc_level=poc_analysis.poc_price,
            target=self.calculate_poc_target(poc_analysis, mode_params),
            stop=self.calculate_poc_retest_stop(poc_analysis, mode_params)
        )
    
    # Value Area High/Low tests
    va_test = self.detect_va_boundary_test(market_data)
    if va_test.institutional_rejection:
        return TrendSignal(
            direction=va_test.rejection_direction,
            confidence=mode_params.profile_confidence,
            pattern='VA_BOUNDARY_REJECTION',
            target=mode_params.target_profit,
            stop=mode_params.stop_loss
        )
```

### **📈 3. VOLUME SPREAD ANALYSIS (VSA)**
```python
def vsa_trend_signal(self, market_data):
    """Tom Williams VSA methodology"""
    
    # Professional volume analysis
    vsa_analysis = self.analyze_professional_volume(market_data)
    
    # Effort vs Result analysis
    if vsa_analysis.high_effort_good_result:
        return TrendSignal(
            direction=vsa_analysis.trend_direction,
            confidence=mode_params.vsa_confidence,
            pattern='VSA_PROFESSIONAL_BUYING',
            volume_signature=vsa_analysis.signature,
            target=mode_params.target_profit,
            stop=mode_params.stop_loss
        )
    
    # No Demand / No Supply detection
    elif vsa_analysis.no_demand_detected:
        return TrendSignal(
            direction='SELL',
            confidence=mode_params.vsa_confidence,
            pattern='VSA_NO_DEMAND',
            target=mode_params.target_profit,
            stop=mode_params.stop_loss
        )
    
    # Climactic action detection
    elif vsa_analysis.climactic_action:
        return TrendSignal(
            direction=vsa_analysis.reversal_direction,
            confidence=mode_params.vsa_confidence,
            pattern='VSA_CLIMACTIC_REVERSAL',
            target=mode_params.target_profit,
            stop=mode_params.stop_loss
        )
```

---

## 🔄 **TRIPLE CONFIRMATION SYSTEM (DL‑001)**

### **Institutional Trend Confirmation:**
```python
class TrendFollowingConsensus:
    def generate_trend_signal(self, market_data):
        """Triple confirmación SMC + Profile + VSA"""
        
        # Get signals from 3 institutional algorithms
        smc_signal = self.smc_trend_signal(market_data)
        profile_signal = self.market_profile_trend_signal(market_data)
        vsa_signal = self.vsa_trend_signal(market_data)
        
        # Require ALL 3 algorithms alignment (umbrales del provider)
        if self.all_signals_aligned([smc_signal, profile_signal, vsa_signal], threshold=mode_params.alignment_confidence):
            
            consensus_direction = smc_signal.direction
            combined_confidence = self.calculate_triple_confidence(
                [smc_signal, profile_signal, vsa_signal], weights=mode_params.triple_weights
            )
            
            return FinalTrendSignal(
                direction=consensus_direction,
                confidence=combined_confidence,
                algorithms=['SMC', 'MARKET_PROFILE', 'VSA'],
                timeframe=mode_params.timeframe_band,
                target_profit=self.calculate_institutional_target(
                    [smc_signal, profile_signal, vsa_signal], mode_params
                ),
                stop_loss=self.calculate_institutional_stop(
                    [smc_signal, profile_signal, vsa_signal], mode_params
                )
            )
        
        return FinalTrendSignal.NO_TRADE
    
    def all_signals_aligned(self, signals, threshold):
        """Verificar alineación de los 3 algoritmos (umbral externo)"""
        valid_signals = [s for s in signals if s.confidence > threshold]
        
        if len(valid_signals) == 3:
            directions = [s.direction for s in valid_signals]
            return len(set(directions)) == 1  # Same direction
        
        return False
```

---

## ⚙️ **EXECUTION PARAMETERS INSTITUCIONALES (DL‑001)**

### **Position Sizing Adaptativo:**
```python
def calculate_trend_position_size(self, capital, trend_strength, volatility, mode_params):
    """Position sizing para trends institucionales (sin literales)."""
    base_risk = mode_params.base_risk
    trend_multiplier = trend_strength / mode_params.baseline_trend
    volatility_adjustment = 1.0 + (volatility * mode_params.volatility_factor)
    final_risk = base_risk * trend_multiplier * volatility_adjustment
    return min(final_risk, mode_params.max_position_risk)
```

### **Timeframes Institucionales:**
```python
TREND_TIMEFRAMES = get_trend_timeframes(mode_params)  # Derivado del provider del modo
```

### **Risk Management Adaptativo:**
```python
TREND_RISK_PARAMS = get_trend_risk_params(mode_params)  # Derivado del provider de modo

---

## DL‑001 Provider del Modo Tendencias (referencia)

Este modo debe consumir parámetros de un provider (sin literales):
- get_triple_weights(), get_alignment_confidence(), get_timeframe_band(), get_target_stop(), get_vsa_confidence(), get_risk_model(), get_trend_timeframes(), get_trend_risk_params().

No crear endpoints nuevos; reutilizar `POST /api/run-smart-trade/{symbol}`. Las decisiones de modo se basan en confirmaciones institucionales reales (SMC/Profile/VSA) y parámetros externos.
```

---

## 📊 **PERFORMANCE TARGETS INSTITUCIONALES**

### **KPIs Objetivo:**
```python
TREND_MODE_TARGETS = {
    'win_rate': 0.75,                # 75% win rate (higher than scalping)
    'profit_factor': 3.0,            # 3.0 profit factor
    'avg_trade_duration': 90,        # 90 minutes average
    'avg_profit_per_trade': 0.025,   # 2.5% average profit
    'max_drawdown_daily': 0.05,      # 5% max daily drawdown
    'trades_per_day': 3,             # 3-5 trend trades daily
    'sharpe_ratio': 3.0              # 3.0 Sharpe target
}
```

### **Institutional Benchmarks:**
```python
INSTITUTIONAL_COMPARISON = {
    'hedge_fund_avg_sharpe': 1.5,    # Our target: 3.0
    'prop_firm_win_rate': 0.65,     # Our target: 0.75
    'bank_profit_factor': 2.2,      # Our target: 3.0
    'institutional_dd': 0.08        # Our target: 0.05
}

---

## 🧭 Fases de Evolución

### Fase 1 — Actual
- Núcleo: SMC (BOS/CHoCH), Market Profile (POC/VA), VSA (parcial), OB de pullback, Microestructura.

### Fase 2 — Optimización
- SMC completo + Market Profile dedicado (migración POC) + VSA robusto.
- Reglas ATR‑normalizadas para breakouts/invalidaciones y pullbacks en OB.
- Gestión de riesgo: trailing progresivo, reducción parcial en VA edges, SL detrás de estructuras clave.

### Fase 3 — Potencialización
- Order Flow v1 para validar breakouts reales.
- Ejecución: balance entre Implementation Shortfall y participación en tendencia (POV adaptativo).
```

---

## 🛡️ **ANTI-MANIPULATION ESPECÍFICO TRENDS**

### **False Breakout Protection:**
```python
def protect_from_false_breakouts(self, breakout_signal, market_data):
    """Protección específica false breakouts institucionales"""
    
    # Validate institutional volume behind breakout
    volume_validation = self.validate_institutional_volume(market_data)
    
    if not volume_validation.institutional_grade:
        return BreakoutReject(reason='RETAIL_VOLUME_PATTERN')
    
    # Check for stop hunt characteristics
    if self.detect_stop_hunt_breakout(breakout_signal, market_data):
        return BreakoutReject(reason='STOP_HUNT_DETECTED')
    
    # Require follow-through confirmation
    followthrough = self.require_followthrough_confirmation(breakout_signal)
    
    return BreakoutApproved(confirmation_required=followthrough)
```

### **Institutional Trap Detection:**
```python
def detect_institutional_traps(self, trend_signal, market_data):
    """Detectar trampas institucionales en trends"""
    
    # Bull trap detection
    if trend_signal.direction == 'BUY':
        bull_trap_risk = self.assess_bull_trap_risk(market_data)
        if bull_trap_risk.high_probability:
            return TrapAlert(
                type='BULL_TRAP',
                probability=bull_trap_risk.probability,
                recommended_action='AVOID_ENTRY'
            )
    
    # Bear trap detection  
    elif trend_signal.direction == 'SELL':
        bear_trap_risk = self.assess_bear_trap_risk(market_data)
        if bear_trap_risk.high_probability:
            return TrapAlert(
                type='BEAR_TRAP',
                probability=bear_trap_risk.probability,
                recommended_action='AVOID_ENTRY'
            )
    
    return TrapAlert.CLEAR
```

---

## 🎯 **MODE INTEGRATION**

### **Activation Logic:**
```python
def should_activate_trend_mode(self, market_state):
    """Lógica activación modo trend following"""
    
    # Strong institutional trend conditions
    institutional_trend = (
        market_state.trend_strength > 0.8 and
        market_state.smc_bos_confirmed and
        market_state.poc_breakout_valid and
        market_state.vsa_professional_volume
    )
    
    # Multi-timeframe alignment
    mtf_alignment = self.check_mtf_alignment(['15m', '1h', '4h'])
    
    # Volume expansion confirmation
    volume_expansion = market_state.volume_ratio > 1.5
    
    return institutional_trend and mtf_alignment and volume_expansion
```

### **Exit Strategy Institucional:**
```python
def institutional_exit_strategy(self, position, market_data):
    """Exit strategy específico trends institucionales"""
    
    # Structure-based exits
    if self.detect_structure_change(market_data):
        return ExitSignal(
            type='STRUCTURE_CHANGE',
            urgency='IMMEDIATE',
            partial_exit=0.5  # Exit 50% on structure change
        )
    
    # VSA exhaustion signals
    elif self.detect_vsa_exhaustion(market_data):
        return ExitSignal(
            type='VSA_EXHAUSTION',
            urgency='HIGH',
            partial_exit=0.75  # Exit 75% on exhaustion
        )
    
    # Target-based exits with trailing
    elif position.unrealized_profit > 0.025:  # 2.5% profit
        return ExitSignal(
            type='TRAILING_STOP',
            urgency='LOW',
            trail_distance=0.01  # 1% trailing distance
        )
```

---

## ✅ **TREND FOLLOWING MODE INSTITUCIONAL COMPLETO**

**CARACTERÍSTICAS:**
- ✅ **Triple Confirmación** SMC + Market Profile + VSA
- ✅ **NO algoritmos retail** (eliminados RSI, MACD, EMA)
- ✅ **Anti-Manipulación** específico false breakouts y traps
- ✅ **Position Sizing** adaptativo según trend strength
- ✅ **Exit Strategy** institucional multi-criterio
- ✅ **Performance Targets** superiores hedge funds

**OBJETIVO:** Capturar trends institucionales 1.5-4% con protección anti-manipulación y confirmación triple algoritmos Smart Money.

---

*Modo: Trend Following Institucional*  
*Algoritmos: SMC + Market Profile + VSA*  
*Estado: ESPECIFICADO - Pendiente implementación*
