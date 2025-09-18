# 11_ACCUMULATION_DISTRIBUTION_SPEC.md — Especificación Técnica Completa

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/11_ACCUMULATION_DISTRIBUTION.md

Propósito
- Detectar acumulación/distribución institucional combinando rango, volumen, microestructura y validaciones MTF para anticipar fases pre-movimientos significativos.

Entradas
- OHLCV (lookback_bars determinado por f_interval(BotConfig.interval)).
- ATR(period_atr) donde period_atr proviene de parámetros del bot/estrategia (no fijo a 14).
- Volumen relativo calculado sobre ventanas adaptativas (derivadas de BotConfig), microestructura cuando disponible.

Salidas
- ad_state (ACCUMULATION/DISTRIBUTION/TRANSITION/NEUTRAL)
- flags: silent_accumulation, stealth_distribution, phase_transition
- confidence [0..1]; details (rango análisis, volumen relativo, institutional_activity)

Precondiciones
- Min lookback_bars según f_interval(BotConfig.interval) y modo operativo; volumen disponible; ATR válido.
- Si los datos no cumplen mínimos adaptativos, retornar estado INSUFFICIENT_DATA (sin hardcodes).

Reglas (resumen)
- Acumulación: rango lateral ≥ theta_range_atr(BotConfig)·ATR + absorción volumen ≥ theta_absorption(BotConfig) + microestructura profesional.
- Distribución: vol_rel(selling_pressure) ≥ theta_distribution(BotConfig) + venta discreta en rango + divergencias precio/volumen.
- Transición: cambio confirmado entre fases con validation_periods(BotConfig) períodos confirmación + confluencia Wyckoff/VSA.
- MTF: coherencia multi-timeframe eleva confianza con weight_mtf(BotConfig) parametrizado.

Integración
- SignalQualityAssessor._evaluate_accumulation_distribution: aplicar reglas parametrizadas; devolver InstitutionalConfirmation.
- Pesos por modo: Anti‑Manipulation aumenta weight_distribution/transition; Trend aumenta weight_accumulation (derivados de BotConfig).

Diagnóstico P1 y Endpoints (no nuevos)
- Confirmar endpoint existente: POST /api/run-smart-trade/{symbol} para exponer ad_state y confirmaciones.
- No crear endpoints nuevos; expandir payload institutional_confirmations.accumulation_distribution.

Rendimiento
- O(lookback); sin llamadas externas; < 50 ms por símbolo.

Pruebas/Validación
- Casos etiquetados de transiciones Wyckoff; evaluar score/bias y consistencia con VSA/Profile.

Implementación (estado actual)
- Código: `backend/services/accumulation_distribution.py` (crear)
- Integración: consumido por `POST /api/run-smart-trade/{symbol}` y visible en `analysis.*`
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

---

## Catálogo de Parámetros (DL‑001 Zero‑Hardcode)

Todos los umbrales/ventanas/pesos se obtienen de funciones o tablas derivadas de BotConfig y estadísticas recientes del símbolo. Ninguna constante queda incrustada en reglas.

- period_atr: definido por estrategia o por perfil de riesgo (configurable por bot).
- lookback_bars = f_interval(interval): función que asigna tamaño de ventana según intervalo y modo.
- recent_window_ratio: proporción de ventana reciente para análisis fases (definida por estrategia).
- theta_range_atr(BotConfig): umbral mínimo rango lateral para acumulación en múltiplos ATR.
- theta_absorption(BotConfig): umbral absorción volumen basado en percentiles dinámicos condicionado por risk_profile.
- theta_distribution(BotConfig): umbral selling pressure para distribución en múltiplos baseline.
- theta_transition(BotConfig): umbral cambio fase basado en confluencia indicators y persistencia.
- validation_periods(BotConfig): períodos mínimos validación transición (derivado de cooldown_minutes).
- range_tolerance_atr(BotConfig), absorption_tolerance_atr(BotConfig): tolerancias en múltiplos ATR.
- δ_accumulation, δ_distribution: umbrales divergencia acumulación/distribución basados en percentiles históricos.
- Pesos scoring: {w_accumulation, w_distribution, w_transition, w_mtf, w_confluence} normalizados por estrategia/modo.
- Sesgos: {τ_accumulation, τ_distribution, τ_neutral} definidos desde distribución histórica ad_state.

Resolución de parámetros (fuente de verdad)
- Entrada BotConfig (creada por usuario) + mediciones recientes (ATR/volumen/percentiles) determinan parámetros efectivos.
- Prohibido fijar valores en implementación: deben inyectarse desde este catálogo.

Normalización y Casing
- ad_state se normaliza a UPPERCASE para consistencia visual/interna.

Frontend (DL‑001)
- Vista "algoritmos avanzados" debe consumir resultados reales de POST /api/run-smart-trade/{symbol}.
- Si faltan datos, mostrar "No data", nunca datos sintéticos.

Diagnóstico P1 (obligatorio antes de cambios)
- grep/verificación endpoints existentes y puntos integración reales.
- Confirmación de `ad_state` y estructura `analysis` expuestos por endpoint existente.

Rollback (P2)
- Cambios pueden revertirse documentando commit/base anterior y volviendo a estado previo.
- Incluir en `docs/MIGRATIONS.md` si se cambian campos payload público.

---

## Señales Parametrizadas (DL‑001) — Sin Hardcodes

Nota: Esta sección sustituye cualquier criterio numérico ilustrativo. Todos los umbrales y ventanas provienen del "Catálogo de Parámetros (DL‑001)" y se resuelven a partir de BotConfig + estadísticas recientes.

Convenciones
- vol_rel(x): volumen relativo en x respecto a baseline parametrizada
- range_strength(x): fuerza rango lateral expresada en múltiplos ATR
- absorption_rate(x): tasa absorción volumen normalizada por threshold
- distribution_pressure(x): presión distribución combinando selling factors
- transition_signal(x): señal transición validada por múltiples confirmaciones
- window_x: ventanas temporales parametrizadas por intervalo/estrategia

Detección 1 — Acumulación Silenciosa
- Silent accumulation:
  - range_strength(lateral_period) ≥ theta_range_atr
  - vol_rel(absorption_window) ≥ theta_absorption
  - institutional_activity ≥ delta_institutional_accumulation
  - microstructure_support ≥ theta_micro_accumulation
  - confirmación en ≤ window_confirm_accumulation

Detección 2 — Distribución Sigilosa
- Stealth distribution:
  - distribution_pressure(selling_window) ≥ theta_distribution
  - price_volume_divergence ≥ delta_divergence_distribution
  - institutional_selling ≥ theta_institutional_distribution
  - range_weakness ≤ max_range_weakness_distribution
  - confirmación en ≤ window_confirm_distribution

Detección 3 — Transición de Fase
- Phase transition:
  - transition_signal(validation_periods) ≥ theta_transition
  - confluence_score(wyckoff_vsa_profile) ≥ theta_confluence_transition
  - persistence_validation ≥ min_persistence_transition
  - mtf_coherence ≥ theta_mtf_transition
  - confirmación en ≤ window_confirm_transition

Detección 4 — Absorción Institucional
- Institutional absorption:
  - absorption_efficiency ≥ theta_absorption_efficiency
  - volume_anomaly_zscore ≥ theta_volume_anomaly
  - price_stability_range ≤ max_price_stability
  - professional_signature ≥ delta_professional_absorption
  - confirmación en ≤ window_confirm_absorption

Detección 5 — Divergencias A/D
- Accumulation/Distribution divergence:
  - price_trend_strength vs volume_trend_strength ≥ theta_divergence
  - institutional_flow_direction ≠ price_direction
  - divergence_persistence ≥ min_divergence_persistence
  - confluence_validation(multiple_algorithms) ≥ theta_confluence_divergence
  - confirmación en ≤ window_confirm_divergence

---

## 🎯 PROPÓSITO

Identificación de acumulación/distribución institucional combinando rango, volumen, microestructura y validaciones MTF, diferenciando actividad profesional vs retail para anticipar movimientos significativos mediante análisis multi-factorial parametrizado.

---

## 📊 ENTRADAS TÉCNICAS

### Datos de Mercado (≥120 períodos)
- OHLCV detallado del bot específico para análisis A/D profundo
- Volumen relativo por período con detalle institucional cuando disponible
- ATR para normalización rango y volatilidad contextual
- Microestructura y tape reading data cuando disponible

### Parámetros User-Specific (NO hardcodes)
```python
# Derivados de BotConfig propiedades reales según Catálogo DL-001
lookback_bars = f_interval(bot_config.interval)              # Ventana análisis A/D adaptativa
period_atr = f_atr_period(bot_config.strategy)               # Período ATR por estrategia
theta_range = theta_range_strength(bot_config)               # Umbral rango lateral mínimo
theta_absorption = theta_absorption_volume(bot_config)       # Threshold absorción institucional
theta_distribution = theta_distribution_pressure(bot_config) # Umbral presión distribución
theta_transition = theta_phase_transition(bot_config)        # Threshold transición fases
validation_periods = validation_periods_ad(bot_config)       # Períodos validación cambio fase
```

---

## 📈 SALIDAS TÉCNICAS

### Señal Principal
```python
{
    "ad_state": "ACCUMULATION|DISTRIBUTION|TRANSITION|NEUTRAL",
    "phase_direction": "BULLISH|BEARISH|SIDEWAYS",
    "confidence": 0.0-1.0,                           # Confianza detección fase
    "phase_details": {
        "silent_accumulation": bool,                 # Acumulación sigilosa activa
        "stealth_distribution": bool,                # Distribución encubierta
        "phase_transition": bool,                    # Transición entre fases
        "absorption_rate": float,                    # Tasa absorción normalizada
        "distribution_pressure": float,              # Presión distribución
        "institutional_activity": float              # Actividad institucional (0-1)
    },
    "confluence_signals": {
        "wyckoff_alignment": bool,
        "vsa_confirmation": bool,
        "profile_support": bool,
        "mtf_coherence": bool
    }
}
```

---

## 🔬 MODELO MATEMÁTICO ACCUMULATION DISTRIBUTION

### 1. ACUMULACIÓN_SILENCIOSA (Silent Accumulation Detection)

**Propósito**: Detectar acumulación institucional sigilosa mediante análisis rango + absorción

**Algoritmo**:
```python
def detect_silent_accumulation(ohlcv_data, volume_data, bot_config, ad_config):
    # Parámetros user-specific según Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    period_atr = f_atr_period(bot_config.strategy)
    theta_range = theta_range_strength(bot_config)
    theta_absorption = theta_absorption_volume(bot_config)
    range_tolerance_atr = range_tolerance_atr_factor(bot_config)

    # Precondiciones (DL-001)
    if len(ohlcv_data) < lookback_bars:
        return {"signal": "INSUFFICIENT_DATA", "reason": "lookback_bars_minimum"}

    if not is_valid_atr_data(ohlcv_data, period_atr):
        return {"signal": "INSUFFICIENT_DATA", "reason": "atr_invalid"}

    # 1. Analizar rango lateral para acumulación
    lateral_periods = []
    atr_current = calculate_atr(ohlcv_data, period_atr)

    for i in range(lookback_bars, len(ohlcv_data)):
        window = ohlcv_data[i-lookback_bars:i]
        range_analysis = analyze_lateral_range(window, atr_current, theta_range)

        if range_analysis['is_lateral'] and range_analysis['strength'] >= theta_range:
            lateral_periods.append({
                'start_idx': i-lookback_bars,
                'end_idx': i,
                'range_strength': range_analysis['strength'],
                'high_level': range_analysis['high'],
                'low_level': range_analysis['low'],
                'range_atr_multiple': range_analysis['atr_multiple']
            })

    # 2. Detectar absorción volumen en rangos laterales
    accumulation_zones = []
    for period in lateral_periods:
        volume_window = volume_data[period['start_idx']:period['end_idx']]
        absorption_analysis = analyze_volume_absorption(
            volume_window, theta_absorption, atr_current
        )

        if absorption_analysis['absorption_detected']:
            # 3. Validar características institucionales
            institutional_signature = validate_institutional_accumulation(
                ohlcv_data[period['start_idx']:period['end_idx']],
                volume_window,
                ad_config
            )

            if institutional_signature['confidence'] >= 0.6:
                accumulation_zones.append({
                    'period': period,
                    'absorption': absorption_analysis,
                    'institutional': institutional_signature,
                    'strength': calculate_accumulation_strength(
                        period, absorption_analysis, institutional_signature
                    )
                })

    # 4. Síntesis acumulación silenciosa
    if accumulation_zones:
        strongest_zone = max(accumulation_zones, key=lambda x: x['strength'])

        # Validar persistencia temporal
        if validate_accumulation_persistence(strongest_zone, ad_config):
            return {
                "signal": "SILENT_ACCUMULATION",
                "accumulation_zone": strongest_zone,
                "strength": strongest_zone['strength'],
                "institutional_confidence": strongest_zone['institutional']['confidence'],
                "absorption_rate": strongest_zone['absorption']['rate'],
                "validation": "CONFIRMED"
            }

    return {"signal": "NO_ACCUMULATION"}

def f_interval(interval):
    """Función lookback_bars A/D según intervalo - DL-001"""
    interval_mapping = {
        '1m': 120,   # A/D necesita más contexto histórico
        '5m': 150,   # Análisis institucional sólido
        '15m': 180,  # Fases A/D detectables
        '1h': 200,   # Contexto macro institucional
        '4h': 250    # Perspectiva A/D completa
    }
    return interval_mapping.get(interval, 150)

def f_atr_period(strategy):
    """Período ATR según estrategia - no fijo a 14"""
    strategy_atr = {
        'accumulation': 21,    # Períodos largos para fases
        'scalping': 14,        # Estándar para micro-A/D
        'swing': 18,          # Balance A/D detección
        'institutional': 28    # Fases macro institucionales
    }
    return strategy_atr.get(strategy, 18)

def theta_range_strength(bot_config):
    """Umbral fuerza rango lateral - DL-001 Zero-Hardcode"""
    base_range = get_baseline_range_percentile()  # Desde histórico
    risk_adjustment = (bot_config.risk_percentage - 1) / 9
    cooldown_factor = get_cooldown_range_factor(bot_config.cooldown_minutes)
    strategy_factor = get_strategy_range_factor(bot_config.strategy)

    return base_range + (risk_adjustment * cooldown_factor * strategy_factor)

def theta_absorption_volume(bot_config):
    """Umbral absorción volumen institucional - DL-001"""
    baseline_absorption = get_baseline_absorption_percentile()  # Estadísticas
    leverage_factor = (bot_config.leverage - 1) / 9
    take_profit_scaling = get_take_profit_absorption_scaling(bot_config.take_profit)

    return baseline_absorption * (1 + leverage_factor * take_profit_scaling)
```

### 2. DISTRIBUCIÓN_SIGILOSA (Stealth Distribution Detection)

**Propósito**: Detectar distribución institucional encubierta mediante presión venta + divergencias

**Algoritmo**:
```python
def detect_stealth_distribution(ohlcv_data, volume_data, bot_config, ad_config):
    # Parámetros user-specific según Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    period_atr = f_atr_period(bot_config.strategy)
    theta_distribution = theta_distribution_pressure(bot_config)
    theta_divergence = theta_price_volume_divergence(bot_config)

    # Precondiciones (DL-001)
    if len(ohlcv_data) < lookback_bars:
        return {"signal": "INSUFFICIENT_DATA", "reason": "lookback_bars_minimum"}

    # 1. Detectar presión venta institucional
    distribution_periods = []
    for i in range(lookback_bars, len(ohlcv_data)):
        window_ohlcv = ohlcv_data[i-lookback_bars:i]
        window_volume = volume_data[i-lookback_bars:i]

        # Calcular presión distribución
        selling_pressure = calculate_selling_pressure_advanced(
            window_ohlcv, window_volume, ad_config
        )

        if selling_pressure['pressure_score'] >= theta_distribution:
            distribution_periods.append({
                'start_idx': i-lookback_bars,
                'end_idx': i,
                'selling_pressure': selling_pressure,
                'pressure_score': selling_pressure['pressure_score']
            })

    # 2. Analizar divergencias precio/volumen
    divergence_signals = []
    for period in distribution_periods:
        window_data = ohlcv_data[period['start_idx']:period['end_idx']]
        volume_window = volume_data[period['start_idx']:period['end_idx']]

        divergence_analysis = analyze_price_volume_divergence(
            window_data, volume_window, theta_divergence
        )

        if divergence_analysis['divergence_detected']:
            # 3. Validar patrón distribución institucional
            institutional_pattern = validate_institutional_distribution(
                window_data, volume_window, divergence_analysis, ad_config
            )

            if institutional_pattern['institutional_confidence'] >= 0.65:
                divergence_signals.append({
                    'period': period,
                    'divergence': divergence_analysis,
                    'institutional': institutional_pattern,
                    'stealth_factor': calculate_stealth_factor(
                        period, divergence_analysis, institutional_pattern
                    )
                })

    # 4. Síntesis distribución sigilosa
    if divergence_signals:
        strongest_distribution = max(divergence_signals, key=lambda x: x['stealth_factor'])

        # Validar persistencia distribución
        if validate_distribution_persistence(strongest_distribution, ad_config):
            return {
                "signal": "STEALTH_DISTRIBUTION",
                "distribution_zone": strongest_distribution,
                "stealth_factor": strongest_distribution['stealth_factor'],
                "institutional_confidence": strongest_distribution['institutional']['institutional_confidence'],
                "divergence_strength": strongest_distribution['divergence']['strength'],
                "validation": "CONFIRMED"
            }

    return {"signal": "NO_DISTRIBUTION"}

def theta_distribution_pressure(bot_config):
    """Umbral presión distribución - DL-001"""
    baseline_pressure = get_baseline_distribution_percentile()
    stop_loss_factor = (bot_config.stop_loss - 1) / 2  # 1-3% scaling
    risk_scaling = get_risk_distribution_scaling(bot_config.risk_percentage)

    return baseline_pressure + (stop_loss_factor * risk_scaling)

def calculate_selling_pressure_advanced(ohlcv_window, volume_window, config):
    """Presión venta avanzada parametrizada - DL-001"""
    selling_strength = 0.0
    institutional_markers = 0

    baseline_volume = calculate_volume_baseline(volume_window)
    atr_current = calculate_atr(ohlcv_window, config['period_atr'])

    for i, (candle, vol_data) in enumerate(zip(ohlcv_window, volume_window)):
        vol_weight = vol_rel(vol_data['volume'], baseline_volume)

        # Selling pressure indicadores
        if candle['close'] < candle['open']:  # Red candles
            body_ratio = (candle['open'] - candle['close']) / (candle['high'] - candle['low'])
            atr_normalized = body_ratio * (candle['high'] - candle['low']) / atr_current
            selling_strength += vol_weight * atr_normalized

            # Marcadores institucionales
            if vol_weight > 1.5 and body_ratio > 0.6:  # High volume + strong bearish body
                institutional_markers += 1

        # Upper wicks en rally = selling pressure
        elif candle['high'] > max(candle['open'], candle['close']):
            wick_ratio = (candle['high'] - max(candle['open'], candle['close'])) / (candle['high'] - candle['low'])
            if wick_ratio > 0.4:  # Significant upper wick
                atr_normalized = wick_ratio * (candle['high'] - candle['low']) / atr_current
                selling_strength += vol_weight * atr_normalized * 0.7

    # Normalizar por períodos y calcular score
    avg_selling_strength = selling_strength / len(ohlcv_window)
    institutional_ratio = institutional_markers / len(ohlcv_window)

    return {
        'pressure_score': avg_selling_strength,
        'institutional_ratio': institutional_ratio,
        'raw_strength': selling_strength,
        'institutional_markers': institutional_markers
    }
```

### 3. TRANSICIÓN_FASE (Phase Transition Detection)

**Propósito**: Detectar transiciones entre fases A/D con validación múltiple

**Algoritmo**:
```python
def detect_phase_transition(ohlcv_data, bot_config, processed_indicators, ad_config):
    # Parámetros user-specific según Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    theta_transition = theta_phase_transition(bot_config)
    validation_periods = validation_periods_ad(bot_config)
    theta_confluence = theta_confluence_transition(bot_config)

    # Precondiciones (DL-001)
    if len(ohlcv_data) < lookback_bars:
        return {"signal": "INSUFFICIENT_DATA", "reason": "lookback_bars_minimum"}

    # 1. Analizar señales transición en ventana temporal
    transition_candidates = []
    for i in range(validation_periods, len(ohlcv_data)):
        validation_window = ohlcv_data[i-validation_periods:i]

        # Detectar cambios estructurales
        structural_change = analyze_structural_change(
            validation_window, theta_transition, ad_config
        )

        if structural_change['change_detected']:
            # 2. Validar con confluencia multi-algoritmo
            confluence_analysis = analyze_transition_confluence(
                structural_change,
                processed_indicators,
                i,
                theta_confluence
            )

            if confluence_analysis['confluence_score'] >= theta_confluence:
                transition_candidates.append({
                    'transition_idx': i,
                    'structural_change': structural_change,
                    'confluence': confluence_analysis,
                    'transition_strength': calculate_transition_strength(
                        structural_change, confluence_analysis
                    )
                })

    # 3. Validar transición más fuerte
    if transition_candidates:
        strongest_transition = max(transition_candidates,
                                 key=lambda x: x['transition_strength'])

        # 4. Confirmar persistencia post-transición
        post_transition_validation = validate_post_transition(
            strongest_transition, ohlcv_data, ad_config
        )

        if post_transition_validation['confirmed']:
            return {
                "signal": "PHASE_TRANSITION",
                "from_phase": strongest_transition['structural_change']['from_phase'],
                "to_phase": strongest_transition['structural_change']['to_phase'],
                "transition_strength": strongest_transition['transition_strength'],
                "confluence_score": strongest_transition['confluence']['confluence_score'],
                "validation": post_transition_validation,
                "timing": strongest_transition['transition_idx']
            }

    return {"signal": "NO_TRANSITION"}

def theta_phase_transition(bot_config):
    """Umbral transición fase - DL-001"""
    baseline_transition = get_baseline_transition_percentile()
    cooldown_factor = get_cooldown_transition_factor(bot_config.cooldown_minutes)
    leverage_scaling = (bot_config.leverage - 1) / 9

    return baseline_transition * (1 + cooldown_factor + leverage_scaling * 0.3)

def analyze_transition_confluence(structural_change, processed_indicators, idx, threshold):
    """Análisis confluencia transición con otros algoritmos"""
    confluence_score = 0.0
    confluence_details = {}

    # Wyckoff phase alignment
    wyckoff = processed_indicators.get('wyckoff', {})
    if wyckoff.get('phase') in ['ACCUMULATION', 'DISTRIBUTION']:
        if aligns_with_wyckoff_transition(structural_change, wyckoff):
            confluence_score += 0.2
            confluence_details['wyckoff'] = 'PHASE_ALIGNMENT'

    # VSA confirmation
    vsa = processed_indicators.get('volume_spread_analysis', {})
    if vsa.get('signal') in ['NO_DEMAND', 'NO_SUPPLY']:
        if validates_vsa_transition(structural_change, vsa):
            confluence_score += 0.15
            confluence_details['vsa'] = 'EFFORT_RESULT_CONFIRMATION'

    # Market Profile support
    profile = processed_indicators.get('market_profile', {})
    if profile.get('signal') in ['VALUE_AREA_REJECTION', 'POC_MIGRATION']:
        if supports_profile_transition(structural_change, profile):
            confluence_score += 0.15
            confluence_details['profile'] = 'VALUE_MIGRATION_SUPPORT'

    # Smart Money Concepts
    smc = processed_indicators.get('smart_money_concepts', {})
    if smc.get('smc_signal') in ['BOS', 'CHOCH']:
        if confirms_smc_transition(structural_change, smc):
            confluence_score += 0.1
            confluence_details['smc'] = 'STRUCTURE_CONFIRMATION'

    # Order Flow alignment
    order_flow = processed_indicators.get('institutional_order_flow', {})
    if order_flow.get('orderflow_signal') in ['ACCUMULATION', 'DISTRIBUTION']:
        if aligns_with_order_flow(structural_change, order_flow):
            confluence_score += 0.1
            confluence_details['order_flow'] = 'FLOW_ALIGNMENT'

    return {
        'confluence_score': min(1.0, confluence_score),
        'details': confluence_details,
        'validation_strength': confluence_score >= threshold
    }
```

### 4. ABSORCIÓN_INSTITUCIONAL (Institutional Absorption)

**Propósito**: Detectar absorción volumen institucional específica

**Algoritmo**:
```python
def detect_institutional_absorption(ohlcv_data, volume_data, bot_config, ad_config):
    # Parámetros user-specific según Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    period_atr = f_atr_period(bot_config.strategy)
    theta_absorption_eff = theta_absorption_efficiency(bot_config)
    theta_volume_anomaly = theta_volume_anomaly_zscore(bot_config)

    # Precondiciones (DL-001)
    if len(volume_data) < lookback_bars:
        return {"signal": "INSUFFICIENT_DATA", "reason": "volume_data_insufficient"}

    # 1. Detectar anomalías volumen institucional
    volume_anomalies = []
    volume_baseline = calculate_volume_baseline(volume_data[-lookback_bars:])
    volume_std = calculate_volume_std(volume_data[-lookback_bars:])

    for i in range(lookback_bars, len(volume_data)):
        current_volume = volume_data[i]['volume']
        z_score = (current_volume - volume_baseline) / max(volume_std, 1)

        if z_score >= theta_volume_anomaly:
            # 2. Analizar eficiencia absorción (volumen vs movimiento precio)
            price_window = ohlcv_data[i-5:i+1]  # Ventana absorción
            absorption_efficiency = calculate_absorption_efficiency(
                price_window, current_volume, period_atr
            )

            if absorption_efficiency >= theta_absorption_eff:
                # 3. Validar signature institucional
                institutional_signature = validate_absorption_signature(
                    price_window, current_volume, ad_config
                )

                if institutional_signature['confidence'] >= 0.7:
                    volume_anomalies.append({
                        'idx': i,
                        'volume': current_volume,
                        'z_score': z_score,
                        'efficiency': absorption_efficiency,
                        'institutional': institutional_signature,
                        'absorption_strength': calculate_absorption_strength_composite(
                            z_score, absorption_efficiency, institutional_signature
                        )
                    })

    # 4. Síntesis absorción institucional
    if volume_anomalies:
        # Buscar clusters de absorción
        absorption_clusters = cluster_absorption_events(volume_anomalies, ad_config)

        for cluster in absorption_clusters:
            if cluster['density'] >= 0.6 and cluster['institutional_ratio'] >= 0.7:
                return {
                    "signal": "INSTITUTIONAL_ABSORPTION",
                    "absorption_cluster": cluster,
                    "strength": cluster['avg_strength'],
                    "institutional_confidence": cluster['institutional_ratio'],
                    "efficiency": cluster['avg_efficiency'],
                    "anomaly_count": len(cluster['events'])
                }

    return {"signal": "NO_ABSORPTION"}

def theta_absorption_efficiency(bot_config):
    """Umbral eficiencia absorción - DL-001"""
    baseline_efficiency = get_baseline_absorption_efficiency()
    risk_adjustment = (10 - bot_config.risk_percentage) / 9  # Risk bajo = mayor sensibilidad
    strategy_factor = get_strategy_absorption_factor(bot_config.strategy)

    return baseline_efficiency * (1 + risk_adjustment * strategy_factor)

def calculate_absorption_efficiency(price_window, volume, atr_period):
    """Eficiencia absorción: volumen alto con movimiento precio limitado"""
    if len(price_window) < 2:
        return 0.0

    price_movement = abs(price_window[-1]['close'] - price_window[0]['close'])
    atr_current = calculate_atr(price_window, atr_period)

    # Movimiento esperado basado en volumen
    volume_baseline = get_recent_volume_baseline(price_window)
    volume_factor = volume / max(volume_baseline, 1)
    expected_movement = atr_current * (volume_factor ** 0.5)

    # Eficiencia: menor movimiento real vs esperado = mayor absorción
    if expected_movement <= 0:
        return 0.0

    efficiency = 1.0 - (price_movement / expected_movement)
    return max(0.0, min(1.0, efficiency))
```

### 5. DIVERGENCIAS_AD (A/D Divergence Analysis)

**Propósito**: Detectar divergencias entre flujos acumulación/distribución y precio

**Algoritmo**:
```python
def detect_ad_divergences(ohlcv_data, volume_data, bot_config, ad_config):
    # Parámetros user-specific según Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    theta_divergence = theta_ad_divergence_strength(bot_config)
    min_persistence = min_divergence_persistence_periods(bot_config)
    theta_confluence_div = theta_confluence_divergence(bot_config)

    # Precondiciones (DL-001)
    if len(ohlcv_data) < lookback_bars:
        return {"signal": "INSUFFICIENT_DATA", "reason": "lookback_bars_minimum"}

    # 1. Calcular tendencias precio y A/D por separado
    price_trends = []
    ad_flow_trends = []

    for i in range(lookback_bars, len(ohlcv_data)):
        window_ohlcv = ohlcv_data[i-lookback_bars:i]
        window_volume = volume_data[i-lookback_bars:i]

        # Tendencia precio
        price_trend = calculate_price_trend_strength(window_ohlcv)
        price_trends.append(price_trend)

        # Tendencia A/D flow
        ad_flow = calculate_ad_flow_trend(window_ohlcv, window_volume, ad_config)
        ad_flow_trends.append(ad_flow)

    # 2. Detectar divergencias significativas
    divergence_periods = []
    for i in range(min_persistence, len(price_trends)):
        price_window = price_trends[i-min_persistence:i]
        flow_window = ad_flow_trends[i-min_persistence:i]

        divergence_analysis = analyze_trend_divergence(
            price_window, flow_window, theta_divergence
        )

        if divergence_analysis['divergence_detected']:
            # 3. Validar persistencia divergencia
            persistence_validation = validate_divergence_persistence(
                divergence_analysis, min_persistence
            )

            if persistence_validation['persistent']:
                # 4. Confirmar con confluencia algoritmos
                confluence_validation = validate_divergence_confluence(
                    divergence_analysis, theta_confluence_div, i
                )

                if confluence_validation['confluence_score'] >= theta_confluence_div:
                    divergence_periods.append({
                        'period_idx': i,
                        'divergence': divergence_analysis,
                        'persistence': persistence_validation,
                        'confluence': confluence_validation,
                        'divergence_strength': calculate_divergence_strength_composite(
                            divergence_analysis, persistence_validation, confluence_validation
                        )
                    })

    # 5. Síntesis divergencias A/D
    if divergence_periods:
        strongest_divergence = max(divergence_periods,
                                 key=lambda x: x['divergence_strength'])

        return {
            "signal": "AD_DIVERGENCE",
            "divergence_type": strongest_divergence['divergence']['type'],
            "strength": strongest_divergence['divergence_strength'],
            "persistence": strongest_divergence['persistence']['periods'],
            "confluence_score": strongest_divergence['confluence']['confluence_score'],
            "price_trend": strongest_divergence['divergence']['price_direction'],
            "flow_trend": strongest_divergence['divergence']['flow_direction'],
            "implication": interpret_divergence_implication(strongest_divergence)
        }

    return {"signal": "NO_DIVERGENCE"}

def theta_ad_divergence_strength(bot_config):
    """Umbral fuerza divergencia A/D - DL-001"""
    baseline_divergence = get_baseline_divergence_threshold()
    take_profit_factor = (bot_config.take_profit - 1) / 4  # 1-5% scaling
    leverage_scaling = (bot_config.leverage - 1) / 9

    return baseline_divergence + (take_profit_factor * leverage_scaling * 0.2)

def calculate_ad_flow_trend(ohlcv_window, volume_window, config):
    """Cálculo tendencia A/D flow parametrizada"""
    ad_values = []

    for candle, vol_data in zip(ohlcv_window, volume_window):
        # A/D Line calculation mejorada
        money_flow_multiplier = calculate_money_flow_multiplier(candle)
        money_flow_volume = money_flow_multiplier * vol_data['volume']
        ad_values.append(money_flow_volume)

    # Tendencia A/D usando regresión lineal
    if len(ad_values) >= 10:
        ad_trend = calculate_linear_regression_slope(ad_values)
        trend_strength = abs(ad_trend) / max(np.std(ad_values), 1e-10)

        return {
            'trend_direction': 'BULLISH' if ad_trend > 0 else 'BEARISH',
            'trend_strength': min(1.0, trend_strength),
            'raw_slope': ad_trend,
            'ad_values': ad_values[-10:]  # Keep recent for validation
        }

    return {'trend_direction': 'NEUTRAL', 'trend_strength': 0.0}

def calculate_money_flow_multiplier(candle):
    """Money Flow Multiplier para A/D Line"""
    typical_price = (candle['high'] + candle['low'] + candle['close']) / 3

    if candle['high'] == candle['low']:
        return 0.0

    return ((candle['close'] - candle['low']) - (candle['high'] - candle['close'])) / (candle['high'] - candle['low'])
```

---

## ⚙️ CONFIGURACIÓN USER-SPECIFIC (Zero Hardcodes)

### Función Configuración Principal
```python
def configure_accumulation_distribution_parameters(bot_config):
    """
    Deriva TODOS los parámetros A/D según Catálogo DL-001 Zero-Hardcode
    Resolución desde BotConfig + estadísticas recientes - prohibido valores fijos
    """
    # Parámetros base desde Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    period_atr = f_atr_period(bot_config.strategy)
    recent_window_ratio = get_recent_window_ratio_ad(bot_config)

    # Umbrales parametrizados (NO hardcodes)
    theta_range = theta_range_strength(bot_config)
    theta_absorption = theta_absorption_volume(bot_config)
    theta_distribution = theta_distribution_pressure(bot_config)
    theta_transition = theta_phase_transition(bot_config)
    theta_divergence = theta_ad_divergence_strength(bot_config)

    # Tolerancias en múltiplos ATR
    range_tolerance_atr = range_tolerance_atr_factor(bot_config)
    absorption_tolerance_atr = absorption_tolerance_atr_factor(bot_config)

    # Ventanas temporales adaptativas
    validation_periods = validation_periods_ad(bot_config)
    window_confirm_accumulation = window_confirm_accumulation(bot_config)
    window_confirm_distribution = window_confirm_distribution(bot_config)
    window_confirm_transition = window_confirm_transition(bot_config)

    # Umbrales confluence
    theta_confluence_transition = theta_confluence_transition(bot_config)
    theta_confluence_divergence = theta_confluence_divergence(bot_config)

    # Pesos de scoring normalizados por estrategia/modo
    weights = get_scoring_weights_ad(bot_config)

    # Sesgos desde distribución histórica
    bias_thresholds = get_bias_thresholds_ad(bot_config)

    return {
        'lookback_bars': lookback_bars,
        'period_atr': period_atr,
        'recent_window_ratio': recent_window_ratio,
        'thresholds': {
            'range': theta_range,
            'absorption': theta_absorption,
            'distribution': theta_distribution,
            'transition': theta_transition,
            'divergence': theta_divergence
        },
        'tolerances_atr': {
            'range': range_tolerance_atr,
            'absorption': absorption_tolerance_atr
        },
        'windows': {
            'validation': validation_periods,
            'confirm_accumulation': window_confirm_accumulation,
            'confirm_distribution': window_confirm_distribution,
            'confirm_transition': window_confirm_transition
        },
        'confluence_thresholds': {
            'transition': theta_confluence_transition,
            'divergence': theta_confluence_divergence
        },
        'scoring_weights': weights,
        'bias_thresholds': bias_thresholds
    }

# Funciones helper parametrizadas (DL-001)
def validation_periods_ad(bot_config):
    """Períodos validación A/D derivados de cooldown"""
    base_periods = max(5, int(bot_config.cooldown_minutes / 5))
    strategy_factor = get_strategy_validation_factor(bot_config.strategy)
    return int(base_periods * strategy_factor)

def theta_confluence_transition(bot_config):
    """Umbral confluencia transición"""
    baseline_confluence = get_baseline_confluence_percentile()
    risk_adjustment = (bot_config.risk_percentage - 1) / 9
    return baseline_confluence + (risk_adjustment * 0.2)

def vol_rel(current_volume, baseline_volume):
    """Volumen relativo A/D parametrizado - DL-001"""
    if baseline_volume <= 0:
        return 0.0
    return current_volume / baseline_volume

def range_strength(high, low, atr_current):
    """Fuerza rango lateral en múltiplos ATR - DL-001"""
    if atr_current <= 0:
        return 0.0
    range_size = high - low
    return range_size / atr_current

def absorption_rate(absorbed_volume, expected_volume):
    """Tasa absorción normalizada - DL-001"""
    if expected_volume <= 0:
        return 0.0
    return min(2.0, absorbed_volume / expected_volume)  # Cap en 2x

def distribution_pressure(selling_strength, baseline_pressure):
    """Presión distribución en múltiplos baseline - DL-001"""
    if baseline_pressure <= 0:
        return 0.0
    return selling_strength / baseline_pressure

def transition_signal(structural_change, confluence_score, weights):
    """Señal transición validada - DL-001"""
    w_structural = weights.get('structural', 0.6)
    w_confluence = weights.get('confluence', 0.4)

    return (structural_change * w_structural) + (confluence_score * w_confluence)
```

---

## 🔗 INTEGRACIÓN BACKEND

### Función Principal
```python
def _evaluate_accumulation_distribution(self, symbol: str, bot_config, market_data, processed_indicators):
    """
    11vo algoritmo institucional - Accumulation Distribution
    Integración con 10 algoritmos existentes
    """
    try:
        # 1. Configuración user-specific según Catálogo DL-001
        ad_config = configure_accumulation_distribution_parameters(bot_config)

        # Validación precondiciones (DL-001)
        validation_result = validate_ad_preconditions(
            market_data, ad_config, symbol
        )
        if validation_result['status'] == 'INSUFFICIENT_DATA':
            return self._get_insufficient_data_ad_result(validation_result)

        # 2. Ejecutar 5 algoritmos A/D
        results = {}

        # Algoritmo 1: Silent Accumulation (DL-001)
        accumulation_result = detect_silent_accumulation(
            market_data['ohlcv'],
            market_data['volume_detail'],
            bot_config,
            ad_config
        )
        results['silent_accumulation'] = accumulation_result

        # Algoritmo 2: Stealth Distribution (DL-001)
        distribution_result = detect_stealth_distribution(
            market_data['ohlcv'],
            market_data['volume_detail'],
            bot_config,
            ad_config
        )
        results['stealth_distribution'] = distribution_result

        # Algoritmo 3: Phase Transition (DL-001)
        transition_result = detect_phase_transition(
            market_data['ohlcv'],
            bot_config,
            processed_indicators,
            ad_config
        )
        results['phase_transition'] = transition_result

        # Algoritmo 4: Institutional Absorption (DL-001)
        absorption_result = detect_institutional_absorption(
            market_data['ohlcv'],
            market_data['volume_detail'],
            bot_config,
            ad_config
        )
        results['institutional_absorption'] = absorption_result

        # Algoritmo 5: A/D Divergences (DL-001)
        divergence_result = detect_ad_divergences(
            market_data['ohlcv'],
            market_data['volume_detail'],
            bot_config,
            ad_config
        )
        results['ad_divergences'] = divergence_result

        # 3. Síntesis A/D
        ad_synthesis = synthesize_ad_signals(results, ad_config)

        # 4. Confluencia con otros algoritmos
        institutional_confluence = calculate_ad_confluence(
            ad_synthesis,
            processed_indicators['wyckoff'],
            processed_indicators['order_blocks'],
            processed_indicators['liquidity_grabs'],
            processed_indicators['stop_hunting'],
            processed_indicators['fair_value_gaps'],
            processed_indicators['market_microstructure'],
            processed_indicators['volume_spread_analysis'],
            processed_indicators['market_profile'],
            processed_indicators['smart_money_concepts'],
            processed_indicators['institutional_order_flow']
        )

        return {
            'ad_state': ad_synthesis['primary_state'],
            'phase_analysis': results,
            'confluence_score': institutional_confluence['total_score'],
            'institutional_activity': institutional_confluence['institutional_activity'],
            'risk_assessment': institutional_confluence['risk_assessment']
        }

    except Exception as e:
        self.logger.error(f"Error evaluating Accumulation Distribution for {symbol}: {str(e)}")
        return self._get_neutral_ad_result()

def synthesize_ad_signals(results, config):
    """Síntesis inteligente de los 5 algoritmos A/D"""
    signals = []
    institutional_evidence = 0.0

    # Ponderar señales según relevancia A/D
    if results['silent_accumulation']['signal'] == 'SILENT_ACCUMULATION':
        signals.append({
            'type': 'ACCUMULATION',
            'strength': results['silent_accumulation']['strength'],
            'weight': 0.3,
            'institutional_factor': 0.9
        })
        institutional_evidence += 0.9 * 0.3

    if results['stealth_distribution']['signal'] == 'STEALTH_DISTRIBUTION':
        signals.append({
            'type': 'DISTRIBUTION',
            'strength': results['stealth_distribution']['stealth_factor'],
            'weight': 0.3,
            'institutional_factor': 0.85
        })
        institutional_evidence += 0.85 * 0.3

    if results['phase_transition']['signal'] == 'PHASE_TRANSITION':
        signals.append({
            'type': 'TRANSITION',
            'strength': results['phase_transition']['transition_strength'],
            'weight': 0.2,
            'institutional_factor': 0.8
        })
        institutional_evidence += 0.8 * 0.2

    if results['institutional_absorption']['signal'] == 'INSTITUTIONAL_ABSORPTION':
        signals.append({
            'type': 'ABSORPTION',
            'strength': results['institutional_absorption']['strength'],
            'weight': 0.1,
            'institutional_factor': 0.95
        })
        institutional_evidence += 0.95 * 0.1

    if results['ad_divergences']['signal'] == 'AD_DIVERGENCE':
        signals.append({
            'type': 'DIVERGENCE',
            'strength': results['ad_divergences']['strength'],
            'weight': 0.1,
            'institutional_factor': 0.7
        })
        institutional_evidence += 0.7 * 0.1

    # Calcular estado dominante
    if not signals:
        return {'primary_state': 'NEUTRAL', 'confidence': 0.0, 'institutional_evidence': 0.0}

    weighted_score = sum(s['strength'] * s['weight'] for s in signals)
    primary_state = determine_ad_state(signals)

    return {
        'primary_state': primary_state,
        'confidence': min(1.0, weighted_score),
        'institutional_evidence': institutional_evidence,
        'contributing_signals': signals
    }

def validate_ad_preconditions(market_data, ad_config, symbol):
    """Validación precondiciones DL-001 - INSUFFICIENT_DATA handling"""
    lookback_required = ad_config['lookback_bars']

    if len(market_data.get('ohlcv', [])) < lookback_required:
        return {
            'status': 'INSUFFICIENT_DATA',
            'reason': 'ohlcv_lookback_insufficient',
            'required': lookback_required,
            'available': len(market_data.get('ohlcv', []))
        }

    if not market_data.get('volume_detail'):
        return {
            'status': 'INSUFFICIENT_DATA',
            'reason': 'volume_detail_missing'
        }

    # Validar ATR data suficiente
    period_atr = ad_config['period_atr']
    if len(market_data['ohlcv']) < period_atr + 20:  # Margen para cálculo A/D
        return {
            'status': 'INSUFFICIENT_DATA',
            'reason': 'atr_data_insufficient',
            'atr_period_required': period_atr
        }

    return {'status': 'VALID'}
```

---

## 🎨 INTEGRACIÓN FRONTEND

### 11vo Algoritmo en Charts
```javascript
// En InstitutionalChart.jsx - agregar A/D como 11vo algoritmo
const institutionalAlgorithms = [
    'wyckoff',
    'order_blocks',
    'liquidity_grabs',
    'stop_hunting',
    'fair_value_gaps',
    'market_microstructure',
    'volume_spread_analysis',
    'market_profile',
    'smart_money_concepts',
    'institutional_order_flow',
    'accumulation_distribution'  // <- 11vo algoritmo
];

const AccumulationDistributionIndicator = ({ data, config }) => {
    if (!data?.accumulation_distribution) return null;

    const ad = data.accumulation_distribution;

    return (
        <div className="ad-indicator">
            {/* Silent Accumulation Zones */}
            {ad.phase_analysis.silent_accumulation.signal === 'SILENT_ACCUMULATION' && (
                <rect
                    className="accumulation-zone"
                    fill="rgba(0,255,0,0.2)"
                    stroke="#00ff00"
                    strokeWidth={2}
                />
            )}

            {/* Stealth Distribution Zones */}
            {ad.phase_analysis.stealth_distribution.signal === 'STEALTH_DISTRIBUTION' && (
                <rect
                    className="distribution-zone"
                    fill="rgba(255,0,0,0.2)"
                    stroke="#ff0000"
                    strokeWidth={2}
                />
            )}

            {/* Phase Transition Markers */}
            {ad.phase_analysis.phase_transition.signal === 'PHASE_TRANSITION' && (
                <div className="transition-marker"
                     style={{
                         position: 'absolute',
                         left: /* transition timing */,
                         top: '50%',
                         color: '#ffa500'
                     }}>
                    🔄 TRANSITION
                </div>
            )}

            {/* A/D State Indicator */}
            <div className="ad-state-indicator"
                 style={{
                     position: 'absolute',
                     top: '10px',
                     right: '10px',
                     backgroundColor: getAdStateColor(ad.ad_state),
                     padding: '5px 10px',
                     borderRadius: '5px'
                 }}>
                {ad.ad_state}
            </div>
        </div>
    );
};

function getAdStateColor(state) {
    switch(state) {
        case 'ACCUMULATION': return 'rgba(0,255,0,0.8)';
        case 'DISTRIBUTION': return 'rgba(255,0,0,0.8)';
        case 'TRANSITION': return 'rgba(255,165,0,0.8)';
        default: return 'rgba(128,128,128,0.8)';
    }
}
```

### Métricas A/D
```javascript
// En SmartScalperMetrics.jsx - agregar métricas A/D
const AccumulationDistributionMetrics = ({ data }) => {
    const ad = data?.accumulation_distribution;
    if (!ad) return null;

    return (
        <div className="ad-metrics">
            <div className="metric">
                <span>A/D State:</span>
                <span className={`value ${ad.ad_state.toLowerCase()}`}>
                    {ad.ad_state}
                </span>
            </div>

            <div className="metric">
                <span>Institutional:</span>
                <span className="value">
                    {(ad.institutional_activity * 100).toFixed(0)}%
                </span>
            </div>

            <div className="metric">
                <span>Confluence:</span>
                <span className="value">
                    {(ad.confluence_score * 100).toFixed(0)}%
                </span>
            </div>

            {/* Special Signals */}
            {ad.phase_analysis.silent_accumulation.signal === 'SILENT_ACCUMULATION' && (
                <div className="special-metric accumulation">
                    <span>🟢 Silent Accumulation</span>
                    <span className="value">
                        {(ad.phase_analysis.silent_accumulation.strength * 100).toFixed(0)}%
                    </span>
                </div>
            )}

            {ad.phase_analysis.stealth_distribution.signal === 'STEALTH_DISTRIBUTION' && (
                <div className="special-metric distribution">
                    <span>🔴 Stealth Distribution</span>
                    <span className="value">
                        {(ad.phase_analysis.stealth_distribution.stealth_factor * 100).toFixed(0)}%
                    </span>
                </div>
            )}

            {ad.phase_analysis.phase_transition.signal === 'PHASE_TRANSITION' && (
                <div className="special-metric transition">
                    <span>🔄 Phase Transition</span>
                    <span className="value">
                        {ad.phase_analysis.phase_transition.from_phase} → {ad.phase_analysis.phase_transition.to_phase}
                    </span>
                </div>
            )}
        </div>
    );
};
```

---

## 📊 RENDIMIENTO Y TESTING

### Especificaciones de Performance
- **Tiempo ejecución**: < 50ms por análisis completo
- **Memoria**: < 12MB para 1000 períodos + volume detail
- **Precisión accumulation**: ≥ 75% en detección fases silenciosas
- **Precisión distribution**: ≥ 70% en distribución encubierta
- **Precisión transitions**: ≥ 80% en cambios fase validados

### Casos de Testing
```python
def test_ad_performance():
    test_cases = [
        {
            'name': 'SILENT_ACCUMULATION_LATERAL',
            'market_condition': 'lateral_range_absorption',
            'expected': 'SILENT_ACCUMULATION with institutional confidence'
        },
        {
            'name': 'STEALTH_DISTRIBUTION_RALLY',
            'market_condition': 'distribution_in_rally',
            'expected': 'STEALTH_DISTRIBUTION with divergence signals'
        },
        {
            'name': 'PHASE_TRANSITION_WYCKOFF',
            'market_condition': 'accumulation_to_markup',
            'expected': 'PHASE_TRANSITION with confluence validation'
        },
        {
            'name': 'INSTITUTIONAL_ABSORPTION_EVENTS',
            'market_condition': 'volume_anomalies_absorption',
            'expected': 'INSTITUTIONAL_ABSORPTION with efficiency'
        },
        {
            'name': 'AD_DIVERGENCE_DETECTION',
            'market_condition': 'price_ad_flow_divergence',
            'expected': 'AD_DIVERGENCE with persistence validation'
        }
    ]
```

---

## 🔗 CONFLUENCE CON ALGORITMOS EXISTENTES

### Integración con 10 Algoritmos Institucionales
```python
def calculate_ad_confluence(ad_result, wyckoff, order_blocks, liquidity_grabs,
                           stop_hunting, fvg, microstructure, vsa, market_profile,
                           smc, order_flow):
    """
    Calcula confluencia A/D con otros 10 algoritmos institucionales
    """
    confluence_score = 0.0
    confluence_details = {}

    # 1. A/D + Wyckoff (fases fundamentales)
    if ad_result['ad_state'] == 'ACCUMULATION' and wyckoff['phase'] == 'ACCUMULATION':
        confluence_score += 0.25
        confluence_details['wyckoff'] = 'ACCUMULATION_PHASE_ALIGNMENT'
    elif ad_result['ad_state'] == 'DISTRIBUTION' and wyckoff['phase'] == 'DISTRIBUTION':
        confluence_score += 0.25
        confluence_details['wyckoff'] = 'DISTRIBUTION_PHASE_ALIGNMENT'

    # 2. A/D + VSA (effort vs result)
    if vsa['signal'] in ['NO_SUPPLY', 'NO_DEMAND']:
        if validates_ad_with_vsa(ad_result, vsa):
            confluence_score += 0.15
            confluence_details['vsa'] = 'EFFORT_RESULT_AD_VALIDATION'

    # 3. A/D + Market Profile (value migration)
    if market_profile['signal'] in ['POC_MIGRATION', 'VALUE_AREA_REJECTION']:
        if supports_ad_with_profile(ad_result, market_profile):
            confluence_score += 0.15
            confluence_details['market_profile'] = 'VALUE_MIGRATION_AD_SUPPORT'

    # 4. A/D + Order Flow (institutional activity)
    if order_flow['orderflow_signal'] in ['ACCUMULATION', 'DISTRIBUTION']:
        if aligns_ad_with_order_flow(ad_result, order_flow):
            confluence_score += 0.1
            confluence_details['order_flow'] = 'INSTITUTIONAL_FLOW_ALIGNMENT'

    # 5. A/D + Smart Money Concepts (structure + phase)
    if smc['smc_signal'] in ['BOS', 'CHOCH']:
        if confirms_ad_with_smc(ad_result, smc):
            confluence_score += 0.1
            confluence_details['smc'] = 'STRUCTURE_PHASE_CONFIRMATION'

    # 6. A/D + Order Blocks (institutional zones)
    if order_blocks['signal'] != 'NEUTRAL':
        if validates_ad_with_ob(ad_result, order_blocks):
            confluence_score += 0.08
            confluence_details['order_blocks'] = 'INSTITUTIONAL_ZONE_VALIDATION'

    # 7. A/D + Liquidity Grabs (manipulation awareness)
    if liquidity_grabs['signal'] == 'GRAB_DETECTED':
        if contextualizes_ad_with_liquidity(ad_result, liquidity_grabs):
            confluence_score += 0.05
            confluence_details['liquidity'] = 'MANIPULATION_CONTEXT'

    # 8. A/D + Stop Hunting (phase invalidation awareness)
    if stop_hunting['signal'] == 'HUNT_DETECTED':
        if warns_ad_invalidation(ad_result, stop_hunting):
            confluence_score -= 0.05  # Reduce confidence
            confluence_details['stop_hunting'] = 'PHASE_INVALIDATION_RISK'

    # 9. A/D + Fair Value Gaps (imbalance context)
    if fvg['signal'] != 'NEUTRAL':
        if contextualizes_ad_with_fvg(ad_result, fvg):
            confluence_score += 0.05
            confluence_details['fvg'] = 'IMBALANCE_CONTEXT'

    # 10. A/D + Market Microstructure (tape reading)
    if microstructure['signal'] in ['INSTITUTIONAL_ACTIVITY', 'PROFESSIONAL_INTEREST']:
        confluence_score += 0.08
        confluence_details['microstructure'] = 'PROFESSIONAL_ACTIVITY_CONFIRMATION'

    # Normalizar score
    confluence_score = min(1.0, max(0.0, confluence_score))

    return {
        'total_score': confluence_score,
        'details': confluence_details,
        'institutional_activity': calculate_institutional_activity(confluence_score, ad_result),
        'risk_assessment': assess_ad_risk(confluence_score, confluence_details)
    }

def calculate_institutional_activity(confluence_score, ad_result):
    """Calcula actividad institucional basada en confluencia y evidencia A/D"""
    base_activity = ad_result.get('institutional_evidence', 0.0)
    confluence_boost = confluence_score * 0.25

    total_activity = min(1.0, base_activity + confluence_boost)

    if total_activity >= 0.8:
        return 'VERY_HIGH_INSTITUTIONAL'
    elif total_activity >= 0.6:
        return 'HIGH_INSTITUTIONAL'
    elif total_activity >= 0.4:
        return 'MODERATE_INSTITUTIONAL'
    else:
        return 'LOW_INSTITUTIONAL'
```

---

## ✅ IMPLEMENTACIÓN

### Archivo Backend
- **Ubicación**: `backend/services/accumulation_distribution.py`
- **Integración**: Import en `backend/routes/real_trading_routes.py`
- **Función**: `_evaluate_accumulation_distribution()` en contexto análisis inteligente

### Referencias SPEC_REF
- **Concepto maestro**: `docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/11_ACCUMULATION_DISTRIBUTION.md`
- **Especificación técnica**: Este documento
- **Índice algoritmos**: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

### Endpoint Integration
- **POST** `/api/run-smart-trade/{symbol}`
- **Respuesta**: `institutional_confirmations.accumulation_distribution`
- **Frontend**: 11vo algoritmo en charts + métricas A/D

---

*Especificación técnica completada aplicando lecciones Wyckoff DL-001 Zero-Hardcode*
*Catálogo Parámetros: Funciones f_interval(), theta_*() parametrizadas*
*Señales Parametrizadas: vol_rel(), range_strength(), absorption_rate() matemáticas*
*Precondiciones: INSUFFICIENT_DATA handling + validación lookback_bars*
*Algoritmos: 5 específicos A/D con nomenclatura Wyckoff*
*Integración: 11vo algoritmo institucional confluencia completa + rollback P2*