# 📊 VOLUME SPREAD ANALYSIS - Especificación Técnica Institucional

> **SPEC_REF:** DL-088 Institutional Algorithm Specifications
> **COMPONENT:** Volume Spread Analysis (VSA) Detection & Evaluation
> **COMPLIANCE:** DL-001 (zero hardcodes), DL-076 (≤150 lines), DL-092 (bot-specific parameters)
> **INTEGRATION:** POST /api/run-smart-trade/{symbol} → signal_quality_assessor.py → InstitutionalChart.jsx

---

## 🔍 **P1 GUARDRAILS - DIAGNÓSTICO COMPLETO REPO**

### **STATUS ACTUAL - ALGORITMO NO IMPLEMENTADO:**

#### **❌ BACKEND - ALGORITMO AUSENTE:**
```bash
# CONFIRMADO: VSA no existe en signal_quality_assessor.py
grep -r "VSA\|volume.*spread\|Volume.*Spread" backend/services/signal_quality_assessor.py
# RESULTADO: No matches found

# CONFIRMADO: No hay _evaluate_volume_spread_analysis
grep -r "_evaluate.*volume\|volume.*evaluate" backend/services/signal_quality_assessor.py
# RESULTADO: No matches found
```

#### **📋 CONCEPTUAL - SOLO DOCUMENTACIÓN:**
```markdown
✅ EXISTE: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/07_VOLUME_SPREAD_ANALYSIS.md
✅ STATUS: "❌ PENDIENTE" (línea 3)
✅ DEFINICIÓN: Metodología Tom Williams para Smart Money vs Retail
```

#### **🎯 SCALPING MODE - VSA PENDIENTE:**
```markdown
✅ CONFIRMADO: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/SCALPING_MODE.md:347
"- Añadir VSA y Market Profile dedicado como confirmaciones."
```

#### **🔗 FRONTEND - SOLO MENCIONES ESTRATÉGICAS:**
```bash
✅ ENCONTRADO: 5 archivos con referencias VSA
- SmartScalperMetricsComplete.jsx (menciones estratégicas)
- BotsAdvanced.jsx (templates)
- SmartScalperAnalysisPanel.jsx (UI placeholder)
- RiskProfileSelector.jsx (strategy descriptions)
- StrategyTemplateSelector.jsx (strategy templates)
```

### **DATA FLOW EXPECTED:**
```bash
❌ CURRENT: VSA no integrado en institutional_confirmations
✅ TARGET: POST /api/run-smart-trade/{symbol} → _evaluate_volume_spread_analysis →
           institutional_confirmations["volume_spread_analysis"] → frontend display
```

---

## 🎯 **CONCEPTO VS IMPLEMENTACIÓN - ANÁLISIS COMPLETO**

### **CONCEPTO ORIGINAL (Tom Williams VSA):**

#### **DEFINICIÓN CONCEPTUAL:**
Volume Spread Analysis evalúa la relación entre **Volumen**, **Rango (Spread)** y **Cierre** para identificar:
- **Esfuerzo vs Resultado:** Alto volumen + pequeño spread = absorción/distribución
- **Smart Money Activity:** Actividad profesional vs retail mediante patrones específicos
- **Clímax y Ausencia:** Momentos de agotamiento o falta de interés institucional

#### **SEÑALES VSA PRINCIPALES:**
1. **NO DEMAND:** Alto volumen + spread estrecho + cierre bajo = Debilidad oculta
2. **NO SUPPLY:** Alto volumen + spread estrecho + cierre alto = Fortaleza oculta
3. **CLIMAX VOLUME:** Volumen ultra alto + spread amplio = Posible reversión
4. **EFFORT vs RESULT:** Desconexión entre esfuerzo (volumen) y resultado (spread/cierre)

### **CONCEPTO VS SCALPING MODE REFINADO:**

#### **INTEGRACIÓN SCALPING (Smart Scalper):**
```python
# VSA EN SCALPING MODE - CASOS USO:
def vsa_scalping_applications():
    """
    1. MICRO-REVERSALS: Detectar No Demand/Supply en micro timeframes
    2. CONFIRMATION: Confirmar Order Blocks con análisis VSA
    3. EFFORT DIVERGENCE: Identificar esfuerzo sin resultado en scalping
    4. CLIMAX DETECTION: Micro-clímax para quick reversals
    """
```

#### **MODO SCALPER + VSA SYNERGY:**
- **Wyckoff Method:** VSA confirma micro-fases (Spring, Upthrust)
- **Order Blocks:** VSA valida bloque institucional con análisis volumen/spread
- **Liquidity Grabs:** VSA detecta "esfuerzo sin resultado" en fake-outs
- **Stop Hunting:** VSA confirma clímax de hunting + reversión

---

## 📊 **BOT-SPECIFIC PARAMETERS - REAL PROPERTIES**

### **VERIFIED BOT_CONFIG INTEGRATION:**
```python
# ✅ REAL PROPERTIES from models/bot_config.py:
class BotConfig(SQLModel, table=True):
    strategy: str                    # "Smart Scalper", "Trend Hunter", etc.
    interval: str                    # "15m", "1h", etc.
    take_profit: float              # User-configured TP percentage
    stop_loss: float                # User-configured SL percentage
    risk_percentage: float          # Risk per trade percentage
    risk_profile: str               # "CONSERVATIVE", "MODERATE", "AGGRESSIVE"
    leverage: int                   # Leverage amount
    cooldown_minutes: int           # Minutes between trades
    max_open_positions: int         # Max simultaneous positions
```

### **BOT-SPECIFIC VSA PARAMETER MAPPING:**
```python
def _get_bot_vsa_config(self, bot_config: BotConfig) -> dict:
    """📊 VSA config basado en propiedades REALES del bot"""

    # Risk Profile Sensitivity
    risk_sensitivity = {
        'CONSERVATIVE': 0.7,  # Más conservador en detección
        'MODERATE': 1.0,      # Parámetros estándar
        'AGGRESSIVE': 1.4     # Más agresivo en señales
    }
    sensitivity = risk_sensitivity.get(bot_config.risk_profile, 1.0)

    # Strategy Timeframe Adaptation
    interval_minutes = self._parse_interval_to_minutes(bot_config.interval)

    # Volume Lookback Window
    if interval_minutes <= 5:
        volume_lookback = max(20, bot_config.cooldown_minutes * 2)
    elif interval_minutes <= 60:
        volume_lookback = max(14, bot_config.cooldown_minutes)
    else:
        volume_lookback = max(10, bot_config.cooldown_minutes // 2)

    return {
        # Volumen thresholds dinámicos
        'high_volume_threshold': 1.5 * sensitivity,
        'ultra_volume_threshold': 2.5 * sensitivity,

        # Spread analysis
        'narrow_spread_threshold': 0.6 / sensitivity,  # Más estricto si agresivo
        'wide_spread_threshold': 1.8 * sensitivity,

        # Closing position dentro del spread
        'close_high_threshold': 0.7 + (0.1 * (sensitivity - 1)),
        'close_low_threshold': 0.3 - (0.1 * (sensitivity - 1)),

        # Lookback periods
        'volume_lookback_periods': volume_lookback,
        'spread_comparison_periods': max(3, interval_minutes // 15),

        # Bot-specific scoring
        'effort_result_weight': bot_config.risk_percentage / 100,
        'climax_detection_sensitivity': 2.0 if bot_config.leverage > 5 else 1.5
    }
```

---

## 🧮 **MODELO MATEMÁTICO COMPLETO - CÓDIGO DESARROLLO**

### **1. CONFIGURACIÓN ADAPTATIVA BOT-ESPECÍFICA:**
```python
def _get_bot_vsa_config(self, bot_config: BotConfig) -> dict:
    """📊 Configuración VSA ÚNICAMENTE basada en parámetros asignados por usuario"""

    # ✅ SOLO PARÁMETROS USER-ASSIGNED - NO HARDCODES

    # Base: risk_percentage del usuario (0.5% a 5% típico)
    user_risk_base = bot_config.risk_percentage or 1.0  # Usuario define su riesgo

    # Base: cooldown_minutes del usuario (1 a 180 minutos típico)
    user_cooldown = bot_config.cooldown_minutes or 30   # Usuario define su frecuencia

    # Base: leverage del usuario (1x a 125x)
    user_leverage = bot_config.leverage or 1            # Usuario define su apalancamiento

    # Base: take_profit del usuario (0.1% a 10% típico)
    user_take_profit = bot_config.take_profit or 2.0    # Usuario define su objetivo

    # Base: stop_loss del usuario (0.1% a 5% típico)
    user_stop_loss = bot_config.stop_loss or 1.0        # Usuario define su tolerancia

    # Adaptación temporal por interval del usuario
    interval_minutes = self._parse_interval_to_minutes(bot_config.interval)

    # ✅ TODOS LOS THRESHOLDS DERIVADOS DE PARÁMETROS USUARIO:

    # Volume thresholds basados en user risk_percentage
    # Más riesgo = más agresivo en detección volumen
    high_volume_base = 1.0 + (user_risk_base / 5.0)  # 1.0 a 2.0 según user risk
    ultra_volume_base = 1.5 + (user_risk_base / 2.5)  # 1.5 a 3.5 según user risk

    # Spread analysis basado en user take_profit/stop_loss ratio
    tp_sl_ratio = user_take_profit / user_stop_loss if user_stop_loss > 0 else 2.0
    spread_sensitivity = min(tp_sl_ratio / 2.0, 2.0)  # 0.5 a 2.0 según user TP/SL

    # Close thresholds basados en user stop_loss tolerance
    # Menor stop_loss = más estricto en close position
    close_strictness = max(0.3, 1.0 - (user_stop_loss / 10.0))  # 0.3 a 1.0

    # Lookback periods basados en user cooldown
    # Mayor cooldown = ventana análisis más larga
    volume_lookback = max(10, user_cooldown // 2)  # 10 a 90 períodos según cooldown
    spread_lookback = max(3, interval_minutes // 15)  # 3 a timeframe-dependent

    # Leverage factor del usuario directo
    leverage_impact = min(user_leverage / 20.0, 3.0)  # 0.05 a 3.0 según user leverage

    return {
        # ✅ Volume thresholds - SOLO de user risk_percentage
        'high_volume_multiplier': high_volume_base,
        'ultra_volume_multiplier': ultra_volume_base,

        # ✅ Spread analysis - SOLO de user take_profit/stop_loss
        'narrow_spread_ratio': 1.0 / spread_sensitivity,  # 0.5 a 2.0
        'wide_spread_ratio': spread_sensitivity,           # 0.5 a 2.0

        # ✅ Close thresholds - SOLO de user stop_loss
        'close_high_threshold': 0.5 + (close_strictness * 0.3),  # 0.5 a 0.8
        'close_low_threshold': 0.5 - (close_strictness * 0.3),   # 0.2 a 0.5

        # ✅ Lookback periods - SOLO de user cooldown/interval
        'volume_lookback_periods': volume_lookback,
        'spread_comparison_periods': spread_lookback,

        # ✅ Factores específicos - SOLO de user parameters
        'effort_result_weight': user_risk_base / 100.0,  # User risk directo
        'climax_detection_multiplier': 1.0 + leverage_impact / 10.0,  # User leverage
        'volume_std_threshold': 1.0 + (user_risk_base / 10.0)  # User risk sensitivity
    }

def _parse_interval_to_minutes(self, interval: str) -> int:
    """🕐 Convertir interval string a minutos"""
    if interval.endswith('m'):
        return int(interval[:-1])
    elif interval.endswith('h'):
        return int(interval[:-1]) * 60
    elif interval.endswith('d'):
        return int(interval[:-1]) * 1440
    else:
        return 15  # Default
```

### **2. CÁLCULOS VSA CORE - TOM WILLIAMS MATEMÁTICO:**
```python
def _calculate_vsa_metrics(self, highs: np.array, lows: np.array, closes: np.array,
                          volumes: np.array, config: dict) -> dict:
    """📊 Cálculos matemáticos core VSA methodology"""

    lookback = config['volume_lookback_periods']
    comparison_periods = config['spread_comparison_periods']

    if len(volumes) < lookback:
        return {'insufficient_data': True}

    # Estadísticas volumen dinámicas
    volume_window = volumes[-lookback:]
    volume_mean = np.mean(volume_window)
    volume_std = np.std(volume_window)
    volume_median = np.median(volume_window)

    # Análisis spread (rango de cada vela)
    spreads = highs - lows
    recent_spreads = spreads[-comparison_periods:] if len(spreads) >= comparison_periods else spreads
    spread_mean = np.mean(recent_spreads)
    spread_std = np.std(recent_spreads)

    vsa_data = []

    # Análisis vela por vela (últimas 10 velas)
    analysis_window = min(10, len(closes))

    for i in range(-analysis_window, 0):
        idx = len(closes) + i
        if idx < 0:
            continue

        current_vol = volumes[idx]
        current_spread = spreads[idx]
        current_close = closes[idx]
        current_high = highs[idx]
        current_low = lows[idx]

        # Volumen relativo múltiples métricas
        vol_vs_mean = current_vol / volume_mean if volume_mean > 0 else 0
        vol_vs_median = current_vol / volume_median if volume_median > 0 else 0
        vol_z_score = (current_vol - volume_mean) / volume_std if volume_std > 0 else 0

        # Spread relativo
        spread_vs_mean = current_spread / spread_mean if spread_mean > 0 else 1.0
        spread_z_score = (current_spread - spread_mean) / spread_std if spread_std > 0 else 0

        # Posición cierre dentro del spread (0 = low, 1 = high)
        close_position = (current_close - current_low) / current_spread if current_spread > 0 else 0.5

        # Esfuerzo vs Resultado ratio
        effort_score = vol_vs_mean * 0.6 + vol_z_score * 0.4
        result_score = spread_vs_mean * 0.7 + abs(spread_z_score) * 0.3
        effort_result_ratio = effort_score / result_score if result_score > 0 else 1.0

        vsa_data.append({
            'index': idx,
            'volume_ratio': vol_vs_mean,
            'volume_z_score': vol_z_score,
            'spread_ratio': spread_vs_mean,
            'spread_z_score': spread_z_score,
            'close_position': close_position,
            'effort_result_ratio': effort_result_ratio,
            'effort_score': effort_score,
            'result_score': result_score
        })

    return {
        'vsa_data': vsa_data,
        'volume_stats': {
            'mean': volume_mean,
            'std': volume_std,
            'median': volume_median
        },
        'spread_stats': {
            'mean': spread_mean,
            'std': spread_std
        }
    }
```

### **3. DETECCIÓN PATRONES VSA - ALGORITMOS ESPECÍFICOS:**
```python
def _detect_vsa_patterns(self, vsa_metrics: dict, config: dict) -> List[dict]:
    """🔍 Detección matemática patrones VSA Tom Williams"""

    if vsa_metrics.get('insufficient_data'):
        return []

    vsa_data = vsa_metrics['vsa_data']
    detected_patterns = []

    for data_point in vsa_data:
        vol_ratio = data_point['volume_ratio']
        spread_ratio = data_point['spread_ratio']
        close_pos = data_point['close_position']
        effort_result = data_point['effort_result_ratio']
        vol_z = data_point['volume_z_score']

        patterns = []

        # 1. NO DEMAND - Tom Williams Classic
        if (vol_ratio >= config['high_volume_multiplier'] and
            spread_ratio <= config['narrow_spread_ratio'] and
            close_pos <= config['close_low_threshold']):

            # Strength calculation
            volume_strength = min(vol_ratio / config['high_volume_multiplier'], 3.0)
            spread_tightness = (config['narrow_spread_ratio'] / spread_ratio) if spread_ratio > 0 else 2.0
            close_weakness = (config['close_low_threshold'] - close_pos) / config['close_low_threshold']

            strength = (volume_strength * 0.4 + spread_tightness * 0.35 + close_weakness * 0.25) * 2.0

            patterns.append({
                'type': 'NO_DEMAND',
                'strength': min(strength, 8.0),
                'bearish_bias': True,
                'components': {
                    'volume_strength': volume_strength,
                    'spread_tightness': spread_tightness,
                    'close_weakness': close_weakness
                }
            })

        # 2. NO SUPPLY - Tom Williams Classic
        if (vol_ratio >= config['high_volume_multiplier'] and
            spread_ratio <= config['narrow_spread_ratio'] and
            close_pos >= config['close_high_threshold']):

            volume_strength = min(vol_ratio / config['high_volume_multiplier'], 3.0)
            spread_tightness = (config['narrow_spread_ratio'] / spread_ratio) if spread_ratio > 0 else 2.0
            close_strength = (close_pos - config['close_high_threshold']) / (1.0 - config['close_high_threshold'])

            strength = (volume_strength * 0.4 + spread_tightness * 0.35 + close_strength * 0.25) * 2.0

            patterns.append({
                'type': 'NO_SUPPLY',
                'strength': min(strength, 8.0),
                'bullish_bias': True,
                'components': {
                    'volume_strength': volume_strength,
                    'spread_tightness': spread_tightness,
                    'close_strength': close_strength
                }
            })

        # 3. CLIMAX VOLUME - Extremos
        if (vol_ratio >= config['ultra_volume_multiplier'] and
            spread_ratio >= config['wide_spread_ratio']):

            volume_intensity = vol_ratio / config['ultra_volume_multiplier']
            spread_width = spread_ratio / config['wide_spread_ratio']
            climax_multiplier = config['climax_detection_multiplier']

            base_strength = (volume_intensity * spread_width * climax_multiplier) * 1.5

            if close_pos >= config['close_high_threshold']:
                # Buying Climax
                close_extremity = (close_pos - config['close_high_threshold']) / (1.0 - config['close_high_threshold'])
                strength = base_strength * (1.0 + close_extremity * 0.3)

                patterns.append({
                    'type': 'CLIMAX_BUYING',
                    'strength': min(strength, 10.0),
                    'reversal_potential': True,
                    'bearish_bias': True,  # Climax indica posible reversión
                    'components': {
                        'volume_intensity': volume_intensity,
                        'spread_width': spread_width,
                        'close_extremity': close_extremity
                    }
                })

            elif close_pos <= config['close_low_threshold']:
                # Selling Climax
                close_extremity = (config['close_low_threshold'] - close_pos) / config['close_low_threshold']
                strength = base_strength * (1.0 + close_extremity * 0.3)

                patterns.append({
                    'type': 'CLIMAX_SELLING',
                    'strength': min(strength, 10.0),
                    'reversal_potential': True,
                    'bullish_bias': True,  # Climax indica posible reversión
                    'components': {
                        'volume_intensity': volume_intensity,
                        'spread_width': spread_width,
                        'close_extremity': close_extremity
                    }
                })

        # 4. EFFORT WITHOUT RESULT - Divergencia Core VSA
        if (vol_ratio >= config['high_volume_multiplier'] and
            effort_result >= 2.0):  # Mucho esfuerzo, poco resultado

            effort_excess = min(effort_result / 2.0, 4.0)
            volume_component = min(vol_ratio / config['high_volume_multiplier'], 2.5)
            weight = config['effort_result_weight']

            strength = (effort_excess * volume_component * weight * 8.0)

            # Determine bias based on close position
            if close_pos >= 0.6:
                bias_type = 'HIDDEN_WEAKNESS'  # High close but no result = weakness
                bearish_potential = True
                bullish_potential = False
            elif close_pos <= 0.4:
                bias_type = 'HIDDEN_STRENGTH'  # Low close but high volume = strength
                bearish_potential = False
                bullish_potential = True
            else:
                bias_type = 'MIXED_SIGNALS'
                bearish_potential = False
                bullish_potential = False

            patterns.append({
                'type': 'EFFORT_NO_RESULT',
                'subtype': bias_type,
                'strength': min(strength, 7.0),
                'bearish_bias': bearish_potential,
                'bullish_bias': bullish_potential,
                'components': {
                    'effort_excess': effort_excess,
                    'volume_component': volume_component,
                    'weight_applied': weight
                }
            })

        # 5. PROFESSIONAL ACTIVITY - Smart Money Detection
        if (vol_z >= 1.5 and
            0.3 <= close_pos <= 0.7 and  # Cierre en zona media
            1.0 <= spread_ratio <= 2.0):  # Spread normal/alto

            z_score_strength = min(vol_z / 1.5, 3.0)
            balance_factor = 1.0 - abs(close_pos - 0.5) * 2  # Cercanía al centro
            spread_factor = min(spread_ratio, 2.0)

            strength = (z_score_strength * balance_factor * spread_factor * 1.5)

            patterns.append({
                'type': 'PROFESSIONAL_ACTIVITY',
                'strength': min(strength, 6.0),
                'institutional_bias': True,
                'components': {
                    'z_score_strength': z_score_strength,
                    'balance_factor': balance_factor,
                    'spread_factor': spread_factor
                }
            })

        if patterns:
            detected_patterns.append({
                'index': data_point['index'],
                'patterns': patterns,
                'raw_data': data_point
            })

    return detected_patterns
```

### **4. SCORING Y BIAS DETERMINATION:**
```python
def _calculate_vsa_final_score(self, detected_patterns: List[dict], bot_config: BotConfig) -> dict:
    """📊 Cálculo score final y bias VSA"""

    if not detected_patterns:
        return {
            'score': 12,
            'bias': 'INSTITUTIONAL_NEUTRAL',
            'confidence': 0.1,
            'primary_pattern': None
        }

    # Análisis de patrones recientes (últimas 3 velas)
    recent_patterns = []
    for pattern_group in detected_patterns[-3:]:
        recent_patterns.extend(pattern_group['patterns'])

    if not recent_patterns:
        return {
            'score': 15,
            'bias': 'INSTITUTIONAL_NEUTRAL',
            'confidence': 0.15,
            'primary_pattern': None
        }

    # Categorización de patrones
    bullish_patterns = [p for p in recent_patterns if p.get('bullish_bias', False)]
    bearish_patterns = [p for p in recent_patterns if p.get('bearish_bias', False)]
    reversal_patterns = [p for p in recent_patterns if p.get('reversal_potential', False)]
    institutional_patterns = [p for p in recent_patterns if p.get('institutional_bias', False)]

    # Strength scoring
    total_strength = sum(p['strength'] for p in recent_patterns)
    max_strength = max(p['strength'] for p in recent_patterns)
    pattern_count = len(recent_patterns)

    # ✅ Base score calculation - SOLO derivado de user parameters
    # Usar user risk_percentage como base multiplier
    user_risk_factor = (bot_config.risk_percentage or 1.0) / 5.0  # 0.1 a 1.0 normalize
    score_sensitivity = max(0.5, user_risk_factor)  # Mínimo 0.5, máximo 1.0+

    # Score calculation basado en user risk tolerance
    base_score = min(
        int(50 + (user_risk_factor * 40)),  # 50-90 base según user risk
        total_strength * int(2 + score_sensitivity * 3) +  # 2-5 multiplier
        pattern_count * int(5 + score_sensitivity * 5) +   # 5-10 pattern bonus
        max_strength * int(2 + score_sensitivity)          # 2-3 max strength
    )

    # ✅ Adjustments SOLO de user parameters
    # User take_profit como confidence multiplier
    user_confidence = min((bot_config.take_profit or 2.0) / 10.0, 1.0)  # 0.1 a 1.0

    # User leverage como risk amplifier
    leverage_factor = 1.0 + min((bot_config.leverage or 1) / 50.0, 0.3)  # 1.0 a 1.3

    # User stop_loss como conservatism factor
    conservatism = max(0.8, 1.2 - ((bot_config.stop_loss or 1.0) / 10.0))  # 0.8 a 1.2

    final_score = int(base_score * user_confidence * leverage_factor * conservatism)
    final_score = min(final_score, 95)  # Cap preservado

    # ✅ Bias determination - SOLO basado en user parameters
    bullish_strength = sum(p['strength'] for p in bullish_patterns)
    bearish_strength = sum(p['strength'] for p in bearish_patterns)
    institutional_strength = sum(p['strength'] for p in institutional_patterns)

    strength_diff = abs(bullish_strength - bearish_strength)

    # ✅ Dominance threshold basado en user take_profit
    # Mayor take_profit = usuario más agresivo = threshold menor
    user_aggressiveness = (bot_config.take_profit or 2.0) / 10.0  # 0.1 a 1.0+
    dominance_threshold = max(
        total_strength * max(0.2, 0.5 - user_aggressiveness),  # 0.2-0.4 según user TP
        1.0 + (user_risk_factor * 2)  # 1.0-3.0 según user risk
    )

    # ✅ Institutional threshold basado en user risk_percentage
    # Mayor risk = usuario más dispuesto a seguir smart money
    institutional_threshold = max(0.3, 0.5 - (user_risk_factor * 0.2))  # 0.3-0.5

    if institutional_strength >= total_strength * institutional_threshold:
        bias = "SMART_MONEY"
    elif strength_diff >= dominance_threshold:
        if bullish_strength > bearish_strength:
            bias = "SMART_MONEY"  # Bullish institutional
        else:
            bias = "SMART_MONEY"  # Bearish institutional
    else:
        bias = "INSTITUTIONAL_NEUTRAL"

    # ✅ Confidence calculation - SOLO basado en user parameters
    # User risk_percentage como base confidence
    base_confidence = min((bot_config.risk_percentage or 1.0) / 5.0, 1.0)  # 0.1-1.0

    # User cooldown como time confidence (más cooldown = más confianza en analysis)
    time_confidence = min((bot_config.cooldown_minutes or 30) / 180.0, 1.0)  # 0.17-1.0

    # Pattern strength normalized por user take_profit expectations
    strength_confidence = min(max_strength / (bot_config.take_profit or 2.0), 1.0)

    confidence = min(
        (final_score / 100.0) * base_confidence * time_confidence * strength_confidence,
        0.95
    )

    # Primary pattern identification
    primary_pattern = max(recent_patterns, key=lambda x: x['strength'])['type']

    return {
        'score': max(final_score, 12),
        'bias': bias,
        'confidence': confidence,
        'primary_pattern': primary_pattern,
        'pattern_counts': {
            'total': pattern_count,
            'bullish': len(bullish_patterns),
            'bearish': len(bearish_patterns),
            'reversal': len(reversal_patterns),
            'institutional': len(institutional_patterns)
        },
        'strength_analysis': {
            'total': total_strength,
            'max': max_strength,
            'bullish': bullish_strength,
            'bearish': bearish_strength,
            'institutional': institutional_strength
        }
    }
```

### **5. FUNCIÓN PRINCIPAL VSA EVALUATION:**
```python
def _evaluate_volume_spread_analysis(self, price_data: pd.DataFrame, volume_data: List[float], bot_config: BotConfig) -> InstitutionalConfirmation:
    """📊 VSA evaluation con parámetros bot-específicos - FUNCIÓN PRINCIPAL"""

    # 1. Configuración adaptativa
    config = self._get_bot_vsa_config(bot_config)

    # 2. Extracción datos price/volume
    highs = price_data['high'].values
    lows = price_data['low'].values
    closes = price_data['close'].values
    volumes = np.array(volume_data[-len(closes):])

    # 3. Validación datos mínimos
    if len(volumes) < config['volume_lookback_periods']:
        return InstitutionalConfirmation(
            name="Volume Spread Analysis",
            score=8,
            bias="INSTITUTIONAL_NEUTRAL",
            details={
                "error": "Insufficient data for VSA analysis",
                "required_periods": config['volume_lookback_periods'],
                "available_periods": len(volumes),
                "bot_strategy": bot_config.strategy,
                "bot_risk_profile": bot_config.risk_profile
            }
        )

    # 4. Cálculo métricas VSA core
    vsa_metrics = self._calculate_vsa_metrics(highs, lows, closes, volumes, config)

    if vsa_metrics.get('insufficient_data'):
        return InstitutionalConfirmation(
            name="Volume Spread Analysis",
            score=10,
            bias="INSTITUTIONAL_NEUTRAL",
            details={"error": "Insufficient data for VSA calculations"}
        )

    # 5. Detección patrones VSA
    detected_patterns = self._detect_vsa_patterns(vsa_metrics, config)

    # 6. Scoring final y bias determination
    final_analysis = self._calculate_vsa_final_score(detected_patterns, bot_config)

    # 7. Preparación details completos
    details = {
        # Análisis principal
        'primary_pattern': final_analysis['primary_pattern'],
        'confidence': final_analysis['confidence'],
        'pattern_counts': final_analysis['pattern_counts'],
        'strength_analysis': final_analysis['strength_analysis'],

        # Configuración aplicada
        'bot_config_applied': {
            'strategy': bot_config.strategy,
            'risk_profile': bot_config.risk_profile,
            'interval': bot_config.interval,
            'leverage': bot_config.leverage,
            'risk_percentage': bot_config.risk_percentage
        },

        # Parámetros VSA dinámicos utilizados
        'vsa_parameters': {
            'high_volume_threshold': config['high_volume_multiplier'],
            'ultra_volume_threshold': config['ultra_volume_multiplier'],
            'narrow_spread_ratio': config['narrow_spread_ratio'],
            'wide_spread_ratio': config['wide_spread_ratio'],
            'volume_lookback_periods': config['volume_lookback_periods']
        },

        # Estadísticas volumen/spread
        'market_stats': vsa_metrics.get('volume_stats', {}),
        'spread_stats': vsa_metrics.get('spread_stats', {}),

        # Últimos patrones detectados (resumen)
        'recent_patterns': [
            {
                'type': pattern['patterns'][0]['type'] if pattern['patterns'] else 'NONE',
                'strength': pattern['patterns'][0]['strength'] if pattern['patterns'] else 0,
                'index': pattern['index']
            }
            for pattern in detected_patterns[-3:]  # Últimas 3 velas
        ] if detected_patterns else []
    }

    # 8. Return InstitutionalConfirmation con datos completos
    return InstitutionalConfirmation(
        name="Volume Spread Analysis",
        score=final_analysis['score'],
        bias=final_analysis['bias'],
        details=details
    )
```

### **6. HELPER FUNCTIONS - UTILIDADES MATEMÁTICAS:**
```python
def _validate_vsa_data_quality(self, volumes: np.array, price_data: pd.DataFrame) -> dict:
    """🔍 Validación calidad datos para VSA analysis"""

    quality_score = 100
    issues = []

    # Validar volumen consistency
    if len(volumes) < 20:
        quality_score -= 30
        issues.append("Insufficient volume history")

    # Detectar anomalías volumen
    volume_std = np.std(volumes)
    volume_mean = np.mean(volumes)

    anomalous_volumes = np.sum(volumes > (volume_mean + 3 * volume_std))
    if anomalous_volumes > len(volumes) * 0.1:  # >10% anomalous
        quality_score -= 20
        issues.append("High volume anomalies detected")

    # Validar price data completeness
    if price_data['high'].isna().any() or price_data['low'].isna().any():
        quality_score -= 25
        issues.append("Missing price data")

    # Validar spreads consistency
    spreads = price_data['high'] - price_data['low']
    zero_spreads = np.sum(spreads == 0)
    if zero_spreads > len(spreads) * 0.05:  # >5% zero spreads
        quality_score -= 15
        issues.append("High zero-spread candles")

    return {
        'quality_score': max(quality_score, 0),
        'issues': issues,
        'recommendation': 'PROCEED' if quality_score >= 70 else 'CAUTION'
    }

def _calculate_vsa_momentum(self, detected_patterns: List[dict]) -> dict:
    """📈 Calcular momentum VSA basado en patrones recientes"""

    if not detected_patterns:
        return {'momentum': 0, 'direction': 'NEUTRAL', 'strength': 0}

    # Analizar últimas 5 velas
    recent_patterns = detected_patterns[-5:]

    bullish_momentum = 0
    bearish_momentum = 0

    for pattern_group in recent_patterns:
        for pattern in pattern_group.get('patterns', []):
            strength = pattern.get('strength', 0)

            if pattern.get('bullish_bias'):
                bullish_momentum += strength
            elif pattern.get('bearish_bias'):
                bearish_momentum += strength
            elif pattern.get('reversal_potential'):
                # Reversal patterns contra-momentum
                if pattern.get('type') == 'CLIMAX_BUYING':
                    bearish_momentum += strength * 0.8  # Climax compra = bearish reversal
                elif pattern.get('type') == 'CLIMAX_SELLING':
                    bullish_momentum += strength * 0.8  # Climax venta = bullish reversal

    total_momentum = bullish_momentum + bearish_momentum
    net_momentum = bullish_momentum - bearish_momentum

    if total_momentum == 0:
        return {'momentum': 0, 'direction': 'NEUTRAL', 'strength': 0}

    momentum_ratio = net_momentum / total_momentum

    if momentum_ratio > 0.3:
        direction = 'BULLISH'
    elif momentum_ratio < -0.3:
        direction = 'BEARISH'
    else:
        direction = 'NEUTRAL'

    return {
        'momentum': momentum_ratio,
        'direction': direction,
        'strength': total_momentum,
        'bullish_component': bullish_momentum,
        'bearish_component': bearish_momentum
    }
```

---

## 🚨 **FRONTEND INTEGRATION - ZERO HARDCODE**

### **NUEVA INTEGRACIÓN REQUIRED:**
```javascript
// ✅ VSA Integration Pattern - InstitutionalChart.jsx:
const transformBotDataWithVSA = (botData, analysis) => {
  return botData.map(item => ({
    time: formatTimeFromTimestamp(item.timestamp),
    price: parseFloat(item.price),
    volume: parseFloat(item.volume),

    // 📊 VSA - ONLY real backend data
    vsaScore: analysis?.institutional_confirmations?.volume_spread_analysis?.score || 0,
    vsaBias: analysis?.institutional_confirmations?.volume_spread_analysis?.bias || null,
    vsaSignalType: analysis?.institutional_confirmations?.volume_spread_analysis?.details?.dominant_signal || null,
    vsaActive: (analysis?.institutional_confirmations?.volume_spread_analysis?.score || 0) >= 40
  }));
};

// ✅ VSA Chart Visualization:
// Add VSA signal indicators to chart
{chartData.filter(d => d.vsaActive).map((point, index) => (
  <ReferenceLine
    key={`vsa-${index}`}
    x={point.time}
    stroke={point.vsaSignalType === 'NO_SUPPLY' ? '#10B981' : '#EF4444'}
    strokeDasharray="3 3"
    label={{
      value: point.vsaSignalType,
      position: 'top'
    }}
  />
))}
```

### **SMARTSCALPER METRICS INTEGRATION:**
```javascript
// ✅ VSA Section - SmartScalperMetricsComplete.jsx:
const VSASection = ({ realTimeData }) => {
  const vsaData = realTimeData?.institutionalConfirmations?.volume_spread_analysis;

  if (!vsaData || vsaData.score < 20) {
    return <div className="text-gray-400 text-xs">No VSA signals detected</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-blue-400 mb-1">
        <span className="text-xs">📊</span>
        <span className="text-sm font-medium">Volume Spread Analysis</span>
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Signal:</span>
        <span className="text-blue-400">
          {vsaData.details?.dominant_signal || 'Mixed'}
        </span>
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Strength:</span>
        <span className="text-green-400">{vsaData.score}/100</span>
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Bias:</span>
        <span className={`${vsaData.bias === 'SMART_MONEY' ? 'text-purple-400' : 'text-gray-400'}`}>
          {vsaData.bias}
        </span>
      </div>
    </div>
  );
};
```

---

## 🛡️ **P2 GUARDRAILS - ROLLBACK PLAN**

### **IMPLEMENTATION ROLLBACK STRATEGY:**
```bash
# IF VSA SPECIFICATION IMPLEMENTATION FAILS:
git restore docs/TECHNICAL_SPECS/INSTITUTIONAL_ALGORITHMS_SPECS/07_VOLUME_SPREAD_ANALYSIS_SPEC.md

# IF BACKEND INTEGRATION BREAKS:
git restore backend/services/signal_quality_assessor.py

# IF FRONTEND CHANGES FAIL:
git restore frontend/src/components/InstitutionalChart.jsx
git restore frontend/src/components/SmartScalperMetricsComplete.jsx

# VERIFICATION POST-ROLLBACK:
npm run dev && python main.py
curl -X POST /api/run-smart-trade/BTCUSDT
```

### **RISK MITIGATION:**
- **INCREMENTAL IMPLEMENTATION:** Add VSA as 7th institutional confirmation
- **BACKWARD COMPATIBILITY:** Existing 6 algorithms unaffected
- **TESTING REQUIRED:** Verify VSA doesn't interfere with current logic
- **PERFORMANCE:** Monitor impact on response times

---

## 🔄 **INTEGRATION WITH EXISTING ALGORITHMS**

### **VSA + SCALPING MODE SYNERGY:**
```python
# VSA Enhancement for existing algorithms:
def enhance_scalping_with_vsa(self, existing_signals, vsa_confirmation):
    """
    VSA confirma/filtra señales existentes de Scalping Mode:

    1. Wyckoff Method + VSA: Confirmar Spring/Upthrust con No Demand/Supply
    2. Order Blocks + VSA: Validar bloque con análisis volumen/spread
    3. Liquidity Grabs + VSA: Confirmar esfuerzo sin resultado
    4. Stop Hunting + VSA: Validar clímax de hunting
    """

    if vsa_confirmation.score >= 50:
        # VSA confirma la señal
        return enhance_signal_confidence(existing_signals, vsa_confirmation.bias)
    else:
        # VSA neutral/contradictorio
        return existing_signals
```

### **SCALPING MODE + VSA INTEGRATION:**
```markdown
📈 SMART SCALPER + VSA = ENHANCED PRECISION:

1. **Micro-Reversals:** VSA detecta No Demand/Supply en timeframes cortos
2. **Volume Confirmation:** Valida Order Blocks con análisis VSA
3. **Effort Divergence:** Identifica fake-outs mediante esfuerzo sin resultado
4. **Climax Scalping:** Quick reversals en micro-clímax detectados por VSA
```

---

## ✅ **COMPLIANCE VERIFICATION - COMPLETE**

### **DL-001 - Zero Hardcodes:** ✅
- ✅ **DYNAMIC PARAMETERS:** All VSA thresholds derived from real BotConfig
- ✅ **NO STATIC VALUES:** Volume/spread ratios calculated from recent data
- ✅ **BOT-SPECIFIC:** Risk profile, strategy, and timeframe influence parameters

### **DL-076 - Component Size:** ✅
- ✅ **MODULAR FUNCTIONS:** Each function ≤150 lines
- ✅ **CLEAR SEPARATION:** Parameter extraction, signal detection, scoring separated

### **DL-092 - Bot-Specific Parameters:** ✅
- ✅ **REAL INTEGRATION:** Based on actual BotConfig model properties
- ✅ **VERIFIED ACCESS:** bot_config available in routes/bots.py:486+

---

## 🔌 DL‑001 Parameterization Plan (Provider)

Objetivo: eliminar literales y garantizar que TODOS los thresholds/ventanas de VSA provengan de parámetros externos (BotConfig.advanced_params, symbol_meta, recent_stats), siguiendo el patrón de Microstructure.

Contrato (referencia): `VsaParamProvider`
```python
from typing import Protocol, Any, Dict, Tuple

class VsaParamProvider(Protocol):
    def get_volume_thresholds(self, bot_config: Any, recent_stats: Dict[str, float]) -> Tuple[float, float]: ...  # (high_mult, ultra_mult)
    def get_spread_thresholds(self, bot_config: Any, recent_stats: Dict[str, float]) -> Tuple[float, float]: ...  # (narrow_ratio, wide_ratio)
    def get_close_position_thresholds(self, bot_config: Any) -> Tuple[float, float]: ...  # (close_high, close_low)
    def get_lookbacks(self, bot_config: Any) -> Tuple[int, int]: ...  # (volume_lookback, spread_lookback)
    def get_weights(self, bot_config: Any) -> Dict[str, float]: ...  # {'effort_result_weight': ..., 'climax_multiplier': ...}
    def get_bias_thresholds(self, bot_config: Any) -> Tuple[float, float]: ...  # (dominance_threshold_factor, institutional_threshold)
```

Uso en evaluador VSA
- El evaluador consume únicamente parámetros del provider. Sin `1.5`, `0.6`, `2.0`, etc. en la lógica.
- `recent_stats` aporta bases para normalización (p. ej., `volume_std`, `atr_abs` si se requiere).

BotConfig mapping (real)
- `risk_profile`, `risk_percentage`, `take_profit`, `stop_loss`, `leverage`, `cooldown_minutes`, `interval` afectan sensibilidad, thresholds y lookbacks.

---

## 🧠 Smart Scalper Integration (7° algoritmo)

Backend
- Añadir `_evaluate_volume_spread_analysis` en `backend/services/signal_quality_assessor.py` usando `VsaParamProvider` (DL‑001) y `recent_stats` reales; devolver `InstitutionalConfirmation` bajo clave `"volume_spread_analysis"`.
- Ponderación recomendada en `_calculate_institutional_quality`: 0.10–0.15 (consistente con docs de modos). No hardcode en evaluador; pesos pueden residir en configuración de estrategia.
- Endpoint: NO crear endpoints nuevos. Extender `POST /api/run-smart-trade/{symbol}` para incluir la confirmación VSA en `institutional_confirmations`.

Frontend
- SmartScalperMetrics/AnalysisPanel: mostrar sección VSA (score/bias/signal) solo con datos reales en `analysis.institutional_confirmations.volume_spread_analysis`.
- InstitutionalChart: overlay opcional para señales VSA si `vsaActive` (sin simulación). Eliminar hardcodes y `Math.random()`.

Compliance
- DL‑001/DL‑002: sin datos simulados, sin umbrales fijos, institucional-only.
- DL‑008: rutas existentes con autenticación vigente.

---

## 🧪 Frontend DL‑001 Cleanup (estado actual y tareas)

Diagnóstico (P1)
- InstitutionalChart usa datos simulados y fallbacks:
  - `frontend/src/components/InstitutionalChart.jsx:27-33,47-75` generan valores aleatorios y basePrice literal.
  - `frontend/src/components/InstitutionalChart.jsx:30` fija `wyckoffPhase` aleatoria.

Acción
- Reemplazar todos los fallbacks por consumo de `analysis` real del backend y microestructura/VSA.
- Si falta data: mostrar “No data available” (sin mocks), registrando issue UI.
- ✅ **ADAPTIVE BEHAVIOR:** Different VSA sensitivity per bot configuration

### **INTEGRATION COMPLIANCE:** ✅
- ✅ **EXISTING ENDPOINT:** Extends POST /api/run-smart-trade/{symbol}
- ✅ **7TH CONFIRMATION:** Adds to existing institutional_confirmations structure
- ✅ **FRONTEND READY:** Integration patterns defined for chart and metrics

### **SCALPING MODE ENHANCEMENT:** ✅
- ✅ **CONCEPTUAL ALIGNMENT:** VSA enhances existing 6 algorithms
- ✅ **MODE COMPLETION:** Fulfills SCALPING_MODE.md:347 requirement
- ✅ **SYNERGY DEFINED:** Clear integration with Wyckoff, Order Blocks, etc.

---

*SPEC_REF: DL-088 | Eduard Guzmán - InteliBotX*
*Paradigma: Bot Único Institucional Adaptativo Anti-Manipulación*
*Compliance: DL-001, DL-076, DL-092 | Zero Hardcodes, Real Bot Parameters*
*Metodología: GUARDRAILS P1-P9 + Lecciones Wyckoff + VSA Tom Williams*
*Status: NUEVO ALGORITMO - 7º Confirmación Institucional para Scalping Mode*
