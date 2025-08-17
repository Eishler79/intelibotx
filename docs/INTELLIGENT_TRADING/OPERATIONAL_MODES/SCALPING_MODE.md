# SCALPING_MODE.md - Modo Base Institucional

> **MODO DEFAULT:** Scalping institucional anti-manipulación con 6 algoritmos Smart Money implementados.

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
            confidence=0.75,
            phase='MICRO_ACCUMULATION',
            target=0.008,  # 0.8% target
            stop=0.004     # 0.4% stop
        )
    
    # Spring detection for quick reversal
    elif self.detect_wyckoff_spring(market_data):
        return ScalpingSignal(
            direction='BUY',
            confidence=0.85,
            phase='SPRING_REVERSAL', 
            target=0.012,  # 1.2% target
            stop=0.003     # 0.3% tight stop
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
                confidence=0.80,
                zone='ORDER_BLOCK_RETEST',
                target=0.010,  # 1.0% from order block
                stop=0.005     # 0.5% beyond block
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
            confidence=0.90,
            pattern='LIQUIDITY_GRAB_FADE',
            target=0.015,  # 1.5% fade profit
            stop=0.005     # 0.5% tight stop
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
            confidence=0.85,
            pattern='STOP_HUNT_REVERSAL',
            target=0.012,  # 1.2% reversal profit
            stop=0.004     # 0.4% stop
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
                confidence=0.75,
                zone='FVG_FILL',
                target=0.008,  # 0.8% to FVG center
                stop=0.004     # 0.4% stop
            )
```

### **✅ 6. MARKET MICROSTRUCTURE VALIDATION**
```python
def microstructure_scalping_signal(self, market_data):
    """Microstructure institucional analysis"""
    
    # Order flow analysis
    order_flow = self.analyze_order_flow(market_data)
    
    # Bid/ask imbalance detection
    if order_flow.institutional_bias and order_flow.imbalance > 0.7:
        return ScalpingSignal(
            direction=order_flow.bias_direction,
            confidence=0.70,
            pattern='MICROSTRUCTURE_BIAS',
            target=0.006,  # 0.6% microstructure move
            stop=0.003     # 0.3% tight stop
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
        
        # Filter high confidence signals (>0.7)
        strong_signals = [s for s in signals if s.confidence > 0.7]
        
        # Require minimum 3/6 algorithm confirmation
        if len(strong_signals) >= 3:
            consensus_direction = self.get_consensus_direction(strong_signals)
            combined_confidence = self.calculate_combined_confidence(strong_signals)
            
            return FinalScalpingSignal(
                direction=consensus_direction,
                confidence=combined_confidence,
                algorithms_count=len(strong_signals),
                target_profit=self.calculate_optimal_target(strong_signals),
                stop_loss=self.calculate_optimal_stop(strong_signals)
            )
        
        return FinalScalpingSignal.NO_TRADE
```

---

## ⚙️ **EXECUTION PARAMETERS**

### **Position Sizing:**
```python
def calculate_scalping_position_size(self, capital, volatility, confidence):
    """Position sizing adaptativo scalping"""
    
    base_risk = 0.01  # 1% base risk
    
    # Adjust based on confidence
    confidence_multiplier = confidence / 0.7  # Scale from 0.7 baseline
    
    # Adjust based on volatility (lower vol = larger position)
    volatility_adjustment = 1.0 / (1.0 + volatility * 10)
    
    final_risk = base_risk * confidence_multiplier * volatility_adjustment
    
    return min(final_risk, 0.02)  # Cap at 2% risk
```

### **Timeframes:**
```python
SCALPING_TIMEFRAMES = {
    'analysis': ['1m', '5m', '15m'],  # Multi-TF analysis
    'entry': '1m',                    # Precise entry timing
    'exit': '1m',                     # Quick exit monitoring
    'confirmation': '5m'              # Higher TF confirmation
}
```

### **Risk Management:**
```python
SCALPING_RISK_PARAMS = {
    'max_position_risk': 0.02,        # 2% max risk per trade
    'target_profit_range': (0.005, 0.015),  # 0.5-1.5% targets
    'stop_loss_range': (0.003, 0.008),      # 0.3-0.8% stops
    'max_trade_duration': 15,         # 15 minutes max
    'min_risk_reward': 1.5,          # Minimum 1.5:1 R:R
    'max_daily_trades': 20           # Max 20 scalping trades/day
}
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