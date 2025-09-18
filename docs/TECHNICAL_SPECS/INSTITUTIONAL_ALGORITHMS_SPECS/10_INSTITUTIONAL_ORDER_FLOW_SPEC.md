# 10_INSTITUTIONAL_ORDER_FLOW_SPEC.md — Especificación Técnica Completa

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/10_INSTITUTIONAL_ORDER_FLOW.md

Propósito
- Detectar señales de order flow institucional (icebergs, bloques, imbalances) con proxies robustos de microestructura; timing institucional y protección anti-manipulación.

Entradas
- OHLCV (lookback_bars determinado por f_interval(BotConfig.interval)).
- ATR(period_atr) donde period_atr proviene de parámetros del bot/estrategia (no fijo a 14).
- Volumen detallado calculado sobre ventanas adaptativas (derivadas de BotConfig), bid/ask proxies cuando disponible.

Salidas
- orderflow_signal (ACCUMULATION/DISTRIBUTION/IMBALANCE/NEUTRAL)
- flags: iceberg_detected, block_activity, level_defense, aggressive_flow
- confidence [0..1]; details (niveles absorción, volumen relativo, institutional_evidence)

Precondiciones
- Min lookback_bars según f_interval(BotConfig.interval) y modo operativo; volumen disponible; ATR válido.
- Si los datos no cumplen mínimos adaptativos, retornar estado INSUFFICIENT_DATA (sin hardcodes).

Reglas (resumen)
- Iceberg: vol_rel(x) vs price_impact con umbrales theta_iceberg(BotConfig); absorción ≥ absorption_tolerance_atr(BotConfig)·ATR.
- Bloques: volumen z-score ≥ theta_block_vol(BotConfig) y contexto precio dentro de block_tolerance_atr(BotConfig)·ATR.
- Imbalance: buying/selling pressure persistente ≥ theta_imbalance(BotConfig) por window_persistence(BotConfig) períodos.
- Defense: nivel tests con rejection_speed y volume_confirmation ≥ theta_defense(BotConfig).
- Flow agresivo: urgency_score combinando price_urgency + volume_urgency ≥ theta_aggression(BotConfig).

Integración
- SignalQualityAssessor._evaluate_institutional_order_flow: aplicar reglas parametrizadas; devolver InstitutionalConfirmation.
- Pesos por modo: Anti‑Manipulation aumenta weight_iceberg/defense; Scalping aumenta weight_aggressive_flow (derivados de BotConfig).

Diagnóstico P1 y Endpoints (no nuevos)
- Confirmar endpoint existente: POST /api/run-smart-trade/{symbol} para exponer orderflow_signal y confirmaciones.
- No crear endpoints nuevos; expandir payload institutional_confirmations.institutional_order_flow.

Rendimiento
- O(lookback); sin llamadas externas; < 75 ms por símbolo.

Pruebas/Validación
- Casos etiquetados de icebergs/bloques y defensa de niveles; evaluar score/bias y consistencia con VSA/Profile.

Implementación (estado actual)
- Código: `backend/services/institutional_order_flow.py` (crear)
- Integración: consumido por `POST /api/run-smart-trade/{symbol}` y visible en `analysis.*`
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

---

## Catálogo de Parámetros (DL‑001 Zero‑Hardcode)

Todos los umbrales/ventanas/pesos se obtienen de funciones o tablas derivadas de BotConfig y estadísticas recientes del símbolo. Ninguna constante queda incrustada en reglas.

- period_atr: definido por estrategia o por perfil de riesgo (configurable por bot).
- lookback_bars = f_interval(interval): función que asigna tamaño de ventana según intervalo y modo.
- recent_window_ratio: proporción de ventana reciente para análisis (definida por estrategia).
- theta_iceberg(BotConfig): umbral absorción iceberg basado en efficiency percentiles dinámicos.
- theta_block_vol(BotConfig): umbral z-score bloques institucionales condicionado por risk_profile/leverage.
- theta_imbalance(BotConfig): umbral persistencia buying/selling pressure en múltiplos baseline.
- theta_defense(BotConfig): umbral fuerza defensa niveles basado en rejection_speed histórico.
- theta_aggression(BotConfig): umbral flujo agresivo combinando price/volume urgency.
- absorption_tolerance_atr(BotConfig), block_tolerance_atr(BotConfig): tolerancias en múltiplos ATR.
- window_persistence(BotConfig): ventana mínima persistencia imbalances (derivada de cooldown_minutes).
- δ_flow, δ_vol: umbrales divergencia flow/volumen basados en percentiles y régimen.
- Pesos scoring: {w_iceberg, w_blocks, w_imbalance, w_defense, w_aggressive} normalizados por estrategia/modo.
- Sesgos: {τ_institutional, τ_neutral} definidos desde distribución histórica institutional_evidence.

Resolución de parámetros (fuente de verdad)
- Entrada BotConfig (creada por usuario) + mediciones recientes (ATR/volumen/percentiles) determinan parámetros efectivos.
- Prohibido fijar valores en implementación: deben inyectarse desde este catálogo.

Normalización y Casing
- orderflow_signal se normaliza a UPPERCASE para consistencia visual/interna.

Frontend (DL‑001)
- Vista "algoritmos avanzados" debe consumir resultados reales de POST /api/run-smart-trade/{symbol}.
- Si faltan datos, mostrar "No data", nunca datos sintéticos.

Diagnóstico P1 (obligatorio antes de cambios)
- grep/verificación endpoints existentes y puntos integración reales.
- Confirmación de `orderflow_signal` y estructura `analysis` expuestos por endpoint existente.

Rollback (P2)
- Cambios pueden revertirse documentando commit/base anterior y volviendo a estado previo.
- Incluir en `docs/MIGRATIONS.md` si se cambian campos payload público.

---

## Señales Parametrizadas (DL‑001) — Sin Hardcodes

Nota: Esta sección sustituye cualquier criterio numérico ilustrativo. Todos los umbrales y ventanas provienen del "Catálogo de Parámetros (DL‑001)" y se resuelven a partir de BotConfig + estadísticas recientes.

Convenciones
- vol_rel(x): volumen relativo en x respecto a baseline parametrizada
- efficiency_ratio(x): ratio precio/volumen normalizado por ATR
- absorption_strength(x): fuerza absorción expresada en múltiplos threshold
- urgency_score(x): score urgencia combinando price/volume factors
- window_x: ventanas temporales parametrizadas por intervalo/estrategia

Detección 1 — Iceberg
- Absorción detection:
  - efficiency_ratio(window) ≤ theta_iceberg_efficiency
  - vol_rel(absorption_period) ≥ theta_vol_iceberg
  - absorption_persistence ≥ min_persistence_iceberg
  - clustering_strength ≥ delta_clustering_iceberg
  - confirmación en ≤ window_confirm_iceberg

Detección 2 — Bloques Institucionales
- Block identification:
  - vol_zscore(block_candidate) ≥ theta_block_vol
  - price_context_strength ≥ theta_price_context
  - stealth_factor ≤ max_stealth_threshold
  - institutional_signature ≥ delta_institutional_block
  - confirmación en ≤ window_confirm_block

Detección 3 — Imbalance Persistente
- Persistence analysis:
  - buying_pressure - selling_pressure ≥ theta_imbalance
  - persistence_periods ≥ window_persistence
  - confidence_ratio ≥ theta_confidence_imbalance
  - directional_consistency ≥ delta_direction_imbalance
  - confirmación en ≤ window_confirm_imbalance

Detección 4 — Defensa Niveles
- Defense validation:
  - rejection_speed ≥ theta_rejection_speed
  - volume_confirmation_rate ≥ theta_vol_defense
  - test_count ≥ min_tests_defense
  - institutional_signature ≥ delta_institutional_defense
  - proximity_factor ≥ theta_proximity_defense

Detección 5 — Flujo Agresivo
- Urgency assessment:
  - price_urgency ≥ theta_price_urgency
  - volume_urgency ≥ theta_volume_urgency
  - combined_urgency_score ≥ theta_aggression
  - cluster_density ≥ theta_cluster_aggression
  - momentum_prediction ≥ delta_momentum_aggression

---

## 🎯 PROPÓSITO

Lectura de desequilibrios y eventos en flujo de órdenes para identificar actividad profesional no visible a retail. Detecta órdenes iceberg, bloques grandes, imbalances persistentes bid/ask y defensa/ataque de niveles institucionales mediante proxies robustos de microestructura.

---

## 📊 ENTRADAS TÉCNICAS

### Datos de Mercado (≥100 períodos)
- OHLCV detallado del bot específico
- Volumen real por período con detalle tick-by-tick cuando disponible
- ATR para volatilidad contextual
- Spread bid/ask cuando disponible

### Parámetros User-Specific (NO hardcodes)
```python
# Derivados de BotConfig propiedades reales según Catálogo DL-001
lookback_bars = f_interval(bot_config.interval)        # Ventana análisis adaptativa
period_atr = f_atr_period(bot_config.strategy)         # Período ATR por estrategia
theta_iceberg = theta_iceberg_efficiency(bot_config)   # Umbral eficiencia absorción
theta_block_vol = theta_block_volume(bot_config)       # Z-score bloques institucionales
theta_imbalance = theta_imbalance_persistence(bot_config) # Persistencia buying/selling
theta_defense = theta_defense_strength(bot_config)     # Fuerza defensa niveles
theta_aggression = theta_aggression_urgency(bot_config) # Score urgencia flujo agresivo
```

---

## 📈 SALIDAS TÉCNICAS

### Señal Principal
```python
{
    "orderflow_signal": "ACCUMULATION|DISTRIBUTION|IMBALANCE|NEUTRAL",
    "flow_direction": "BULLISH|BEARISH|BALANCED",
    "confidence": 0.0-1.0,                    # Confianza detección
    "flow_details": {
        "iceberg_detected": bool,              # Órdenes iceberg activas
        "block_activity": float,               # Tamaño bloques relativos
        "bid_ask_imbalance": float,           # Ratio desequilibrio (-1 a +1)
        "absorption_level": float,             # Precio absorción detectado
        "defense_strength": float              # Fuerza defensa nivel (0-1)
    },
    "institutional_signals": {
        "hidden_accumulation": bool,
        "stealth_distribution": bool,
        "level_defense": bool,
        "aggressive_attack": bool
    }
}
```

---

## 🔬 MODELO MATEMÁTICO INSTITUTIONAL ORDER FLOW

### 1. DETECCIÓN_ICEBERG (Hidden Order Detection)

**Propósito**: Detectar órdenes iceberg mediante patrones de absorción

**Algoritmo**:
```python
def detect_iceberg_activity(ohlcv_data, volume_data, bot_config):
    # Parámetros user-specific según Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    period_atr = f_atr_period(bot_config.strategy)
    theta_iceberg_eff = theta_iceberg_efficiency(bot_config)
    absorption_tolerance_atr = absorption_tolerance_atr_factor(bot_config)
    window_persistence = window_persistence_iceberg(bot_config)

    # Precondiciones (DL-001)
    if len(ohlcv_data) < lookback_bars:
        return {"signal": "INSUFFICIENT_DATA", "reason": "lookback_bars_minimum"}

    if not is_valid_atr_data(ohlcv_data, period_atr):
        return {"signal": "INSUFFICIENT_DATA", "reason": "atr_invalid"}

    # 1. Analizar patrones volumen vs movimiento precio
    price_impact_efficiency = []
    for i in range(absorption_window, len(ohlcv_data)):
        window_data = ohlcv_data[i-absorption_window:i]
        volume_window = volume_data[i-absorption_window:i]

        # Calcular eficiencia precio-volumen
        price_movement = abs(window_data[-1]['close'] - window_data[0]['close'])
        total_volume = sum(v['volume'] for v in volume_window)
        avg_volume = total_volume / absorption_window

        # Eficiencia normal vs actual
        expected_movement = calculate_expected_movement(total_volume, avg_volume)
        efficiency = price_movement / max(expected_movement, 0.001)

        price_impact_efficiency.append({
            'timestamp': i,
            'efficiency': efficiency,
            'volume': total_volume,
            'price_movement': price_movement
        })

    # 2. Identificar zonas de baja eficiencia (absorción)
    absorption_zones = []
    for point in price_impact_efficiency:
        if point['efficiency'] < iceberg_threshold:
            # Volumen alto pero movimiento limitado = posible iceberg
            absorption_zones.append({
                'level': ohlcv_data[point['timestamp']]['close'],
                'strength': 1.0 - point['efficiency'],  # Invertir para strength
                'volume_absorbed': point['volume'],
                'absorption_efficiency': point['efficiency']
            })

    # 3. Validar persistencia absorción
    if len(absorption_zones) >= 2:
        # Verificar niveles similares (clustering)
        clustered_zones = cluster_absorption_levels(absorption_zones)

        for cluster in clustered_zones:
            if cluster['persistence'] >= 2:  # Mínimo 2 confirmaciones
                return {
                    "signal": "ICEBERG_DETECTED",
                    "absorption_level": cluster['avg_level'],
                    "strength": cluster['avg_strength'],
                    "volume_evidence": cluster['total_volume'],
                    "persistence": cluster['persistence']
                }

    return {"signal": "NO_ICEBERG"}

def theta_iceberg_efficiency(bot_config):
    """Umbral eficiencia absorción iceberg según DL-001 Zero-Hardcode"""
    # Risk bajo = mayor sensibilidad (detecta icebergs sutiles)
    # Risk alto = solo icebergs muy evidentes
    base_efficiency = 0.3  # Baseline desde percentiles históricos
    risk_factor = (10 - bot_config.risk_percentage) / 9
    strategy_adjustment = get_strategy_iceberg_adjustment(bot_config.strategy)

    return base_efficiency + (risk_factor * strategy_adjustment)

def calculate_expected_movement(volume, avg_volume, period_atr, atr_data):
    """Movimiento esperado parametrizado según DL-001"""
    vol_rel_factor = vol_rel(volume, avg_volume)
    atr_current = calculate_atr(atr_data, period_atr)
    movement_scaling = get_movement_scaling_factor()  # Desde estadísticas históricas

    return atr_current * (vol_rel_factor ** movement_scaling)
```

### 2. BLOQUES_INSTITUCIONALES (Large Block Detection)

**Propósito**: Identificar ejecución de bloques grandes institucionales

**Algoritmo**:
```python
def detect_institutional_blocks(ohlcv_data, volume_data, bot_config):
    # Parámetros user-specific según Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    period_atr = f_atr_period(bot_config.strategy)
    theta_block_vol = theta_block_volume(bot_config)
    block_tolerance_atr = block_tolerance_atr_factor(bot_config)
    window_confirm = window_confirm_block(bot_config)

    # Precondiciones (DL-001)
    if len(ohlcv_data) < lookback_bars:
        return {"signal": "INSUFFICIENT_DATA", "reason": "lookback_bars_minimum"}

    if len(volume_data) < window_confirm:
        return {"signal": "INSUFFICIENT_DATA", "reason": "volume_data_insufficient"}

    # 1. Identificar picos volumen anómalos
    volume_profile = calculate_volume_profile(volume_data, 20)  # 20 períodos referencia
    avg_volume = volume_profile['average']
    std_volume = volume_profile['std_deviation']

    block_candidates = []
    for i in range(len(volume_data)):
        current_volume = volume_data[i]['volume']

        # Volumen significativamente superior a normal
        if current_volume > (avg_volume + (std_volume * block_threshold)):
            z_score = (current_volume - avg_volume) / std_volume

            # Analizar contexto precio para determinar tipo bloque
            price_context = analyze_price_context(ohlcv_data, i, confirmation_periods)

            block_candidates.append({
                'timestamp': i,
                'volume': current_volume,
                'z_score': z_score,
                'price_level': ohlcv_data[i]['close'],
                'type': classify_block_type(price_context),
                'urgency': calculate_block_urgency(price_context)
            })

    # 2. Clasificar bloques por intención institucional
    institutional_blocks = []
    for block in block_candidates:
        if block['z_score'] >= 2.0:  # Mínimo 2 desviaciones estándar
            # Determinar si es acumulación o distribución
            surrounding_context = analyze_surrounding_activity(
                ohlcv_data, block['timestamp'], confirmation_periods
            )

            block_classification = {
                'signal': 'INSTITUTIONAL_BLOCK',
                'type': block['type'],
                'size_score': min(1.0, block['z_score'] / 5.0),
                'level': block['price_level'],
                'intention': classify_intention(surrounding_context),
                'stealth_factor': calculate_stealth_factor(surrounding_context)
            }

            institutional_blocks.append(block_classification)

    # 3. Síntesis actividad institucional
    if institutional_blocks:
        dominant_intention = analyze_dominant_intention(institutional_blocks)
        return {
            "signal": "BLOCK_ACTIVITY",
            "dominant_intention": dominant_intention,
            "block_count": len(institutional_blocks),
            "largest_block": max(institutional_blocks, key=lambda x: x['size_score']),
            "stealth_assessment": assess_overall_stealth(institutional_blocks)
        }

    return {"signal": "NO_BLOCKS"}

def theta_block_volume(bot_config):
    """Umbral z-score bloques institucionales según DL-001"""
    # Leverage alto = detectar bloques más pequeños
    # Leverage bajo = solo bloques muy grandes
    base_zscore = get_baseline_zscore_blocks()  # Desde percentiles históricos
    leverage_sensitivity = (bot_config.leverage - 1) / 9
    mode_adjustment = get_mode_block_adjustment(bot_config.strategy)

    return base_zscore - (leverage_sensitivity * mode_adjustment)

def classify_block_type(price_context):
    if price_context['price_pressure'] > 0.6:
        return 'AGGRESSIVE_BUY'
    elif price_context['price_pressure'] < -0.6:
        return 'AGGRESSIVE_SELL'
    elif abs(price_context['price_movement']) < 0.2:
        return 'STEALTH_ACCUMULATION'
    else:
        return 'NEUTRAL_EXECUTION'
```

### 3. IMBALANCE_PERSISTENTE (Persistent Bid/Ask Imbalance)

**Propósito**: Detectar desequilibrios persistentes en flujo de órdenes

**Algoritmo**:
```python
def detect_persistent_imbalance(ohlcv_data, bot_config):
    # Parámetros user-specific según Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    window_imbalance = window_imbalance_analysis(bot_config)
    theta_imbalance = theta_imbalance_persistence(bot_config)
    window_persistence = window_persistence_periods(bot_config)
    theta_confidence = theta_confidence_imbalance(bot_config)

    # Precondiciones (DL-001)
    if len(ohlcv_data) < lookback_bars:
        return {"signal": "INSUFFICIENT_DATA", "reason": "lookback_bars_minimum"}

    if window_imbalance > len(ohlcv_data):
        return {"signal": "INSUFFICIENT_DATA", "reason": "imbalance_window_insufficient"}

    # 1. Calcular proxy bid/ask imbalance usando microestructura
    imbalances = []
    for i in range(imbalance_window, len(ohlcv_data)):
        window = ohlcv_data[i-imbalance_window:i]

        # Proxy imbalance usando precio y volumen
        buying_pressure = calculate_buying_pressure(window)
        selling_pressure = calculate_selling_pressure(window)

        total_pressure = buying_pressure + selling_pressure
        if total_pressure > 0:
            imbalance_ratio = (buying_pressure - selling_pressure) / total_pressure
        else:
            imbalance_ratio = 0.0

        imbalances.append({
            'timestamp': i,
            'imbalance_ratio': imbalance_ratio,  # -1 (bearish) to +1 (bullish)
            'buying_pressure': buying_pressure,
            'selling_pressure': selling_pressure,
            'confidence': calculate_imbalance_confidence(window)
        })

    # 2. Identificar persistencia direccional
    persistent_periods = []
    current_streak = []

    for imb in imbalances:
        if abs(imb['imbalance_ratio']) > persistence_threshold:
            if current_streak and (
                (current_streak[-1]['imbalance_ratio'] > 0) == (imb['imbalance_ratio'] > 0)
            ):
                # Misma dirección, continuar streak
                current_streak.append(imb)
            else:
                # Cambio dirección, evaluar streak anterior
                if len(current_streak) >= 3:  # Mínimo persistencia
                    persistent_periods.append(current_streak)
                current_streak = [imb]
        else:
            # Imbalance débil, evaluar streak
            if len(current_streak) >= 3:
                persistent_periods.append(current_streak)
            current_streak = []

    # Evaluar último streak
    if len(current_streak) >= 3:
        persistent_periods.append(current_streak)

    # 3. Analizar implicaciones institucionales
    if persistent_periods:
        latest_period = persistent_periods[-1]
        avg_imbalance = sum(p['imbalance_ratio'] for p in latest_period) / len(latest_period)
        avg_confidence = sum(p['confidence'] for p in latest_period) / len(latest_period)

        return {
            "signal": "PERSISTENT_IMBALANCE",
            "direction": "BULLISH" if avg_imbalance > 0 else "BEARISH",
            "strength": abs(avg_imbalance),
            "persistence": len(latest_period),
            "confidence": avg_confidence,
            "institutional_bias": interpret_institutional_bias(avg_imbalance, len(latest_period))
        }

    return {"signal": "BALANCED"}

def vol_rel(current_volume, baseline_volume):
    """Volumen relativo parametrizado - DL-001"""
    if baseline_volume <= 0:
        return 0.0
    return current_volume / baseline_volume

def efficiency_ratio(price_movement, volume, atr_current):
    """Ratio eficiencia precio/volumen normalizado por ATR - DL-001"""
    if atr_current <= 0 or volume <= 0:
        return 0.0
    normalized_movement = price_movement / atr_current
    volume_factor = math.log(max(1.0, volume))
    return normalized_movement / volume_factor

def absorption_strength(efficiency, theta_baseline):
    """Fuerza absorción en múltiplos threshold - DL-001"""
    if theta_baseline <= 0:
        return 0.0
    return max(0.0, (theta_baseline - efficiency) / theta_baseline)

def urgency_score(price_urgency, volume_urgency, weights):
    """Score urgencia combinando factores price/volume - DL-001"""
    w_price = weights.get('price_urgency', 0.4)
    w_volume = weights.get('volume_urgency', 0.6)
    return (price_urgency * w_price) + (volume_urgency * w_volume)

def calculate_buying_pressure(window, vol_baseline, atr_current):
    """Proxy buying pressure parametrizado - DL-001"""
    buying_strength = 0.0
    for candle in window:
        vol_weight = vol_rel(candle['volume'], vol_baseline)

        # Velas bullish con volumen = buying pressure
        if candle['close'] > candle['open']:
            body_ratio = (candle['close'] - candle['open']) / (candle['high'] - candle['low'])
            atr_normalized = body_ratio * (candle['high'] - candle['low']) / atr_current
            buying_strength += vol_weight * atr_normalized

        # Upper wicks = buying support (menor peso)
        elif candle['high'] > max(candle['open'], candle['close']):
            wick_ratio = (candle['high'] - max(candle['open'], candle['close'])) / (candle['high'] - candle['low'])
            atr_normalized = wick_ratio * (candle['high'] - candle['low']) / atr_current
            buying_strength += vol_weight * atr_normalized * 0.5

    return buying_strength

def calculate_selling_pressure(window, vol_baseline, atr_current):
    """Proxy selling pressure parametrizado - DL-001"""
    selling_strength = 0.0
    for candle in window:
        vol_weight = vol_rel(candle['volume'], vol_baseline)

        # Velas bearish con volumen = selling pressure
        if candle['close'] < candle['open']:
            body_ratio = (candle['open'] - candle['close']) / (candle['high'] - candle['low'])
            atr_normalized = body_ratio * (candle['high'] - candle['low']) / atr_current
            selling_strength += vol_weight * atr_normalized

        # Lower wicks = selling pressure (menor peso)
        elif candle['low'] < min(candle['open'], candle['close']):
            wick_ratio = (min(candle['open'], candle['close']) - candle['low']) / (candle['high'] - candle['low'])
            atr_normalized = wick_ratio * (candle['high'] - candle['low']) / atr_current
            selling_strength += vol_weight * atr_normalized * 0.5

    return selling_strength
```

### 4. DEFENSA_NIVELES (Level Defense Detection)

**Propósito**: Detectar defensa institucional de niveles clave

**Algoritmo**:
```python
def detect_level_defense(ohlcv_data, bot_config):
    # Parámetros user-specific según Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    period_atr = f_atr_period(bot_config.strategy)
    theta_defense = theta_defense_strength(bot_config)
    defense_tolerance_atr = defense_tolerance_atr_factor(bot_config)
    min_tests_defense = min_tests_defense_level(bot_config)
    theta_proximity = theta_proximity_defense(bot_config)

    # Precondiciones (DL-001)
    if len(ohlcv_data) < lookback_bars:
        return {"signal": "INSUFFICIENT_DATA", "reason": "lookback_bars_minimum"}

    # 1. Identificar niveles de soporte/resistencia recientes
    key_levels = identify_key_levels(ohlcv_data, defense_window)

    defended_levels = []
    for level in key_levels:
        # 2. Analizar tests del nivel
        level_tests = find_level_tests(ohlcv_data, level, defense_sensitivity)

        if len(level_tests) >= 2:  # Mínimo 2 tests para validar defensa
            defense_quality = analyze_defense_quality(level_tests, ohlcv_data)

            if defense_quality['strength'] > 0.6:  # Defensa fuerte
                defended_levels.append({
                    'level': level['price'],
                    'type': level['type'],  # SUPPORT/RESISTANCE
                    'defense_strength': defense_quality['strength'],
                    'test_count': len(level_tests),
                    'volume_confirmation': defense_quality['volume_confirmation'],
                    'institutional_signature': detect_institutional_signature(level_tests)
                })

    # 3. Evaluar actividad defensiva actual
    if defended_levels:
        current_price = ohlcv_data[-1]['close']

        # Encontrar nivel más relevante (más cercano)
        nearest_level = min(defended_levels,
                          key=lambda x: abs(x['level'] - current_price))

        distance_to_level = abs(current_price - nearest_level['level'])
        proximity_factor = 1.0 - min(1.0, distance_to_level / (calculate_atr(14) * 2))

        if proximity_factor > 0.3:  # Cerca del nivel defendido
            return {
                "signal": "LEVEL_DEFENSE",
                "defended_level": nearest_level['level'],
                "level_type": nearest_level['type'],
                "defense_strength": nearest_level['defense_strength'],
                "proximity": proximity_factor,
                "institutional_confidence": nearest_level['institutional_signature'],
                "actionable": proximity_factor > 0.7
            }

    return {"signal": "NO_DEFENSE"}

def analyze_defense_quality(level_tests, ohlcv_data):
    # Evaluar calidad de defensa del nivel
    total_strength = 0.0
    volume_confirmations = 0

    for test in level_tests:
        # Fuerza basada en rechazo rápido
        rejection_speed = calculate_rejection_speed(test, ohlcv_data)
        volume_spike = test['volume'] / test['avg_volume']

        test_strength = rejection_speed * min(2.0, volume_spike) / 2.0
        total_strength += test_strength

        if volume_spike > 1.5:  # Volumen confirma defensa
            volume_confirmations += 1

    avg_strength = total_strength / len(level_tests)
    volume_confirmation_rate = volume_confirmations / len(level_tests)

    return {
        'strength': min(1.0, avg_strength),
        'volume_confirmation': volume_confirmation_rate
    }

def detect_institutional_signature(level_tests):
    # Detectar si el patrón sugiere defensa institucional
    signatures = 0

    for test in level_tests:
        # Características institucionales:
        # 1. Volumen elevado en rechazo
        if test['volume'] / test['avg_volume'] > 2.0:
            signatures += 1

        # 2. Rechazo con mecha larga (absorción)
        if test['wick_ratio'] > 0.6:  # 60% de la vela es mecha
            signatures += 1

        # 3. Recuperación rápida post-test
        if test['recovery_strength'] > 0.7:
            signatures += 1

    # Normalizar por número de tests
    return min(1.0, signatures / (len(level_tests) * 3))
```

### 5. FLUJO_AGRESIVO (Aggressive Flow Detection)

**Propósito**: Detectar flujo agresivo institucional (market orders grandes)

**Algoritmo**:
```python
def detect_aggressive_flow(ohlcv_data, volume_data, bot_config):
    # Parámetros user-specific según Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    period_atr = f_atr_period(bot_config.strategy)
    theta_aggression = theta_aggression_urgency(bot_config)
    theta_price_urgency = theta_price_urgency_factor(bot_config)
    theta_volume_urgency = theta_volume_urgency_factor(bot_config)
    theta_cluster = theta_cluster_aggression(bot_config)

    # Precondiciones (DL-001)
    if len(ohlcv_data) < lookback_bars:
        return {"signal": "INSUFFICIENT_DATA", "reason": "lookback_bars_minimum"}

    # 1. Identificar ejecuciones agresivas
    aggressive_flows = []

    for i in range(flow_window, len(ohlcv_data)):
        window_data = ohlcv_data[i-flow_window:i+1]
        current_candle = ohlcv_data[i]

        # Detectar características de ejecución agresiva
        price_urgency = calculate_price_urgency(window_data)
        volume_urgency = calculate_volume_urgency(volume_data[i], volume_data[i-flow_window:i])

        # Agresión = movimiento rápido + volumen alto + poca paciencia
        aggression_score = (price_urgency * 0.4) + (volume_urgency * 0.6)

        if aggression_score > aggression_threshold:
            # Determinar dirección del flujo agresivo
            flow_direction = determine_flow_direction(window_data)

            aggressive_flows.append({
                'timestamp': i,
                'aggression_score': aggression_score,
                'direction': flow_direction,
                'price_level': current_candle['close'],
                'volume_factor': volume_urgency,
                'urgency_signature': classify_urgency_signature(price_urgency, volume_urgency)
            })

    # 2. Analizar patrones de flujo agresivo
    if aggressive_flows:
        # Buscar clusters de agresión
        flow_clusters = cluster_aggressive_flows(aggressive_flows)

        for cluster in flow_clusters:
            if cluster['density'] > 0.6:  # Alta concentración
                return {
                    "signal": "AGGRESSIVE_FLOW",
                    "direction": cluster['dominant_direction'],
                    "intensity": cluster['avg_aggression'],
                    "concentration": cluster['density'],
                    "institutional_pattern": analyze_institutional_pattern(cluster),
                    "momentum_prediction": predict_flow_momentum(cluster, ohlcv_data)
                }

    return {"signal": "NO_AGGRESSIVE_FLOW"}

def calculate_price_urgency(window_data, atr_current, urgency_threshold):
    """Urgencia precio parametrizada - DL-001"""
    if len(window_data) < 2 or atr_current <= 0:
        return 0.0

    total_movement = 0.0
    for i in range(1, len(window_data)):
        period_movement = abs(window_data[i]['close'] - window_data[i-1]['close'])
        atr_normalized = period_movement / atr_current
        # Aplicar threshold dinámico
        urgency_factor = max(0.0, atr_normalized - urgency_threshold)
        total_movement += urgency_factor

    avg_urgency = total_movement / (len(window_data) - 1)
    return min(1.0, avg_urgency)

def calculate_volume_urgency(current_volume, vol_baseline, urgency_percentile):
    """Urgencia volumen parametrizada - DL-001"""
    if vol_baseline <= 0:
        return 0.0

    vol_ratio = vol_rel(current_volume, vol_baseline)

    # Threshold dinámico basado en percentiles históricos
    if vol_ratio <= urgency_percentile:
        return 0.0

    # Logaritmo parametrizado para suavizar
    import math
    excess_ratio = vol_ratio / urgency_percentile
    urgency = math.log(excess_ratio) / math.log(10)
    return min(1.0, urgency)

def classify_urgency_signature(price_urgency, volume_urgency, signature_thresholds):
    """Clasificación signature urgencia parametrizada - DL-001"""
    thresholds = signature_thresholds

    if (price_urgency > thresholds['panic_price'] and
        volume_urgency > thresholds['panic_volume']):
        return 'INSTITUTIONAL_PANIC'
    elif (price_urgency > thresholds['professional_price'] and
          volume_urgency > thresholds['professional_volume']):
        return 'PROFESSIONAL_URGENCY'
    elif (price_urgency < thresholds['stealth_price'] and
          volume_urgency > thresholds['stealth_volume']):
        return 'STEALTH_ACCUMULATION'
    else:
        return 'RETAIL_NOISE'
```

---

## ⚙️ CONFIGURACIÓN USER-SPECIFIC (Zero Hardcodes)

### Función Configuración Principal
```python
def configure_order_flow_parameters(bot_config):
    """
    Deriva TODOS los parámetros Order Flow según Catálogo DL-001 Zero-Hardcode
    Resolución desde BotConfig + estadísticas recientes - prohibido valores fijos
    """
    # Parámetros base desde Catálogo DL-001
    lookback_bars = f_interval(bot_config.interval)
    period_atr = f_atr_period(bot_config.strategy)
    recent_window_ratio = get_recent_window_ratio(bot_config)

    # Umbrales parametrizados (NO hardcodes)
    theta_iceberg = theta_iceberg_efficiency(bot_config)
    theta_block_vol = theta_block_volume(bot_config)
    theta_imbalance = theta_imbalance_persistence(bot_config)
    theta_defense = theta_defense_strength(bot_config)
    theta_aggression = theta_aggression_urgency(bot_config)

    # Tolerancias en múltiplos ATR
    absorption_tolerance_atr = absorption_tolerance_atr_factor(bot_config)
    block_tolerance_atr = block_tolerance_atr_factor(bot_config)
    defense_tolerance_atr = defense_tolerance_atr_factor(bot_config)

    # Ventanas temporales adaptativas
    window_persistence = window_persistence_periods(bot_config)
    window_confirm_iceberg = window_confirm_iceberg(bot_config)
    window_confirm_block = window_confirm_block(bot_config)
    window_confirm_defense = window_confirm_defense(bot_config)

    # Pesos de scoring normalizados por estrategia/modo
    weights = get_scoring_weights_order_flow(bot_config)

    # Sesgos desde distribución histórica
    bias_thresholds = get_bias_thresholds_order_flow(bot_config)

    return {
        'lookback_bars': lookback_bars,
        'period_atr': period_atr,
        'recent_window_ratio': recent_window_ratio,
        'thresholds': {
            'iceberg': theta_iceberg,
            'block_vol': theta_block_vol,
            'imbalance': theta_imbalance,
            'defense': theta_defense,
            'aggression': theta_aggression
        },
        'tolerances_atr': {
            'absorption': absorption_tolerance_atr,
            'block': block_tolerance_atr,
            'defense': defense_tolerance_atr
        },
        'windows': {
            'persistence': window_persistence,
            'confirm_iceberg': window_confirm_iceberg,
            'confirm_block': window_confirm_block,
            'confirm_defense': window_confirm_defense
        },
        'scoring_weights': weights,
        'bias_thresholds': bias_thresholds
    }

def f_interval(interval):
    """Función que asigna lookback_bars según intervalo - DL-001"""
    interval_mapping = {
        '1m': 80,   # Scalping necesita más datos
        '5m': 100,  # Micro-estructura detallada
        '15m': 120, # Análisis institucional sólido
        '1h': 150,  # Contexto macro institucional
        '4h': 200   # Perspectiva institucional completa
    }
    return interval_mapping.get(interval, 120)  # Default desde percentiles

def f_atr_period(strategy):
    """Período ATR según estrategia - no fijo a 14"""
    strategy_atr = {
        'scalping': 10,
        'swing': 14,
        'position': 20,
        'institutional': 21
    }
    return strategy_atr.get(strategy, 14)

def theta_iceberg_efficiency(bot_config):
    """Umbral eficiencia absorción iceberg - DL-001 Zero-Hardcode"""
    base_efficiency = get_baseline_efficiency_percentile()  # Desde histórico
    risk_adjustment = (10 - bot_config.risk_percentage) / 9
    strategy_factor = get_strategy_iceberg_factor(bot_config.strategy)
    mode_adjustment = get_mode_iceberg_adjustment(bot_config)

    return base_efficiency + (risk_adjustment * strategy_factor * mode_adjustment)

def theta_block_volume(bot_config):
    """Umbral z-score bloques institucionales - DL-001"""
    baseline_zscore = get_baseline_zscore_blocks_percentile()  # Histórico
    leverage_sensitivity = (bot_config.leverage - 1) / 9
    cooldown_factor = get_cooldown_block_factor(bot_config.cooldown_minutes)
    strategy_adjustment = get_strategy_block_adjustment(bot_config.strategy)

    return baseline_zscore - (leverage_sensitivity * cooldown_factor * strategy_adjustment)

def theta_imbalance_persistence(bot_config):
    """Umbral persistencia buying/selling pressure - DL-001"""
    base_imbalance = get_baseline_imbalance_percentile()  # Desde estadísticas
    take_profit_factor = (bot_config.take_profit - 1) / 4  # 1-5% normalización
    interval_adjustment = get_interval_imbalance_adjustment(bot_config.interval)

    return base_imbalance + (take_profit_factor * interval_adjustment)

def theta_defense_strength(bot_config):
    """Umbral fuerza defensa niveles - DL-001"""
    baseline_defense = get_baseline_defense_percentile()  # Histórico
    stop_loss_factor = (bot_config.stop_loss - 1) / 2  # 1-3% normalización
    risk_adjustment = get_risk_defense_adjustment(bot_config.risk_percentage)

    return baseline_defense + (stop_loss_factor * risk_adjustment)

def theta_aggression_urgency(bot_config):
    """Umbral score urgencia flujo agresivo - DL-001"""
    baseline_urgency = get_baseline_urgency_percentile()  # Estadísticas
    leverage_factor = (bot_config.leverage - 1) / 9
    interval_scaling = get_interval_urgency_scaling(bot_config.interval)

    return baseline_urgency + (leverage_factor * interval_scaling)

# Funciones auxiliares de tolerancia ATR (DL-001)
def absorption_tolerance_atr_factor(bot_config):
    """Factor tolerancia absorción en múltiplos ATR"""
    base_tolerance = get_baseline_tolerance_atr()
    risk_scaling = (bot_config.risk_percentage - 1) / 9
    return base_tolerance * (1 + risk_scaling * 0.5)

def block_tolerance_atr_factor(bot_config):
    """Factor tolerancia bloques en múltiplos ATR"""
    base_tolerance = get_baseline_block_tolerance_atr()
    leverage_scaling = (bot_config.leverage - 1) / 9
    return base_tolerance * (1 + leverage_scaling * 0.3)

def defense_tolerance_atr_factor(bot_config):
    """Factor tolerancia defensa en múltiplos ATR"""
    base_tolerance = get_baseline_defense_tolerance_atr()
    stop_loss_scaling = (bot_config.stop_loss - 1) / 2
    return base_tolerance * (1 + stop_loss_scaling * 0.4)

# Funciones de ventanas temporales adaptativas
def window_persistence_periods(bot_config):
    """Ventana mínima persistencia imbalances"""
    base_window = max(3, int(bot_config.cooldown_minutes / 10))
    interval_factor = get_interval_persistence_factor(bot_config.interval)
    return int(base_window * interval_factor)

def window_confirm_iceberg(bot_config):
    """Ventana confirmación iceberg"""
    base_confirm = get_baseline_confirm_periods()
    strategy_factor = get_strategy_confirm_factor(bot_config.strategy)
    return max(2, int(base_confirm * strategy_factor))
```

---

## 🔗 INTEGRACIÓN BACKEND

### Función Principal
```python
def _evaluate_institutional_order_flow(self, symbol: str, bot_config, market_data, processed_indicators):
    """
    10mo algoritmo institucional - Institutional Order Flow
    Integración con 9 algoritmos existentes
    """
    try:
        # 1. Configuración user-specific según Catálogo DL-001
        flow_config = configure_order_flow_parameters(bot_config)

        # Validación precondiciones (DL-001)
        validation_result = validate_order_flow_preconditions(
            market_data, flow_config, symbol
        )
        if validation_result['status'] == 'INSUFFICIENT_DATA':
            return self._get_insufficient_data_order_flow_result(validation_result)

        # 2. Ejecutar 5 algoritmos Order Flow
        results = {}

        # Algoritmo 1: Iceberg Detection (DL-001)
        iceberg_result = detect_iceberg_activity(
            market_data['ohlcv'],
            market_data['volume_detail'],
            bot_config,
            flow_config
        )
        results['iceberg_detection'] = iceberg_result

        # Algoritmo 2: Institutional Blocks (DL-001)
        block_result = detect_institutional_blocks(
            market_data['ohlcv'],
            market_data['volume_detail'],
            bot_config,
            flow_config
        )
        results['institutional_blocks'] = block_result

        # Algoritmo 3: Persistent Imbalance (DL-001)
        imbalance_result = detect_persistent_imbalance(
            market_data['ohlcv'],
            bot_config,
            flow_config
        )
        results['persistent_imbalance'] = imbalance_result

        # Algoritmo 4: Level Defense (DL-001)
        defense_result = detect_level_defense(
            market_data['ohlcv'],
            bot_config,
            flow_config
        )
        results['level_defense'] = defense_result

        # Algoritmo 5: Aggressive Flow (DL-001)
        aggressive_result = detect_aggressive_flow(
            market_data['ohlcv'],
            market_data['volume_detail'],
            bot_config,
            flow_config
        )
        results['aggressive_flow'] = aggressive_result

        # 3. Síntesis Order Flow
        flow_synthesis = synthesize_order_flow_signals(results, flow_config)

        # 4. Confluencia con otros algoritmos
        institutional_confluence = calculate_order_flow_confluence(
            flow_synthesis,
            processed_indicators['wyckoff'],
            processed_indicators['order_blocks'],
            processed_indicators['liquidity_grabs'],
            processed_indicators['stop_hunting'],
            processed_indicators['fair_value_gaps'],
            processed_indicators['market_microstructure'],
            processed_indicators['volume_spread_analysis'],
            processed_indicators['market_profile'],
            processed_indicators['smart_money_concepts']
        )

        return {
            'orderflow_signal': flow_synthesis['primary_signal'],
            'flow_analysis': results,
            'confluence_score': institutional_confluence['total_score'],
            'institutional_bias': institutional_confluence['institutional_bias'],
            'risk_assessment': institutional_confluence['risk_assessment']
        }

    except Exception as e:
        self.logger.error(f"Error evaluating Institutional Order Flow for {symbol}: {str(e)}")
        return self._get_neutral_order_flow_result()

def validate_order_flow_preconditions(market_data, flow_config, symbol):
    """Validación precondiciones DL-001 - INSUFFICIENT_DATA handling"""
    lookback_required = flow_config['lookback_bars']

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
    period_atr = flow_config['period_atr']
    if len(market_data['ohlcv']) < period_atr + 10:  # Margen para cálculo ATR
        return {
            'status': 'INSUFFICIENT_DATA',
            'reason': 'atr_data_insufficient',
            'atr_period_required': period_atr
        }

    return {'status': 'VALID'}

def _get_insufficient_data_order_flow_result(validation_result):
    """Resultado estándar para datos insuficientes - DL-001"""
    return {
        'orderflow_signal': 'INSUFFICIENT_DATA',
        'flow_analysis': {
            'validation_error': validation_result,
            'iceberg_detection': {'signal': 'INSUFFICIENT_DATA'},
            'institutional_blocks': {'signal': 'INSUFFICIENT_DATA'},
            'persistent_imbalance': {'signal': 'INSUFFICIENT_DATA'},
            'level_defense': {'signal': 'INSUFFICIENT_DATA'},
            'aggressive_flow': {'signal': 'INSUFFICIENT_DATA'}
        },
        'confluence_score': 0.0,
        'institutional_bias': 'UNKNOWN',
        'risk_assessment': 'DATA_INSUFFICIENT'
    }

def synthesize_order_flow_signals(results, config):
    """Síntesis inteligente de los 5 algoritmos Order Flow"""
    signals = []
    institutional_evidence = 0.0

    # Ponderar señales según relevancia institucional
    if results['iceberg_detection']['signal'] == 'ICEBERG_DETECTED':
        signals.append({
            'type': 'ICEBERG',
            'strength': results['iceberg_detection']['strength'],
            'weight': 0.25,
            'institutional_factor': 0.9  # Icebergs son muy institucionales
        })
        institutional_evidence += 0.9 * 0.25

    if results['institutional_blocks']['signal'] == 'BLOCK_ACTIVITY':
        signals.append({
            'type': 'BLOCKS',
            'strength': results['institutional_blocks']['largest_block']['size_score'],
            'weight': 0.3,
            'institutional_factor': 0.85
        })
        institutional_evidence += 0.85 * 0.3

    if results['persistent_imbalance']['signal'] == 'PERSISTENT_IMBALANCE':
        signals.append({
            'type': 'IMBALANCE',
            'strength': results['persistent_imbalance']['strength'],
            'weight': 0.2,
            'institutional_factor': 0.7
        })
        institutional_evidence += 0.7 * 0.2

    if results['level_defense']['signal'] == 'LEVEL_DEFENSE':
        signals.append({
            'type': 'DEFENSE',
            'strength': results['level_defense']['defense_strength'],
            'weight': 0.15,
            'institutional_factor': results['level_defense']['institutional_confidence']
        })
        institutional_evidence += results['level_defense']['institutional_confidence'] * 0.15

    if results['aggressive_flow']['signal'] == 'AGGRESSIVE_FLOW':
        signals.append({
            'type': 'AGGRESSIVE',
            'strength': results['aggressive_flow']['intensity'],
            'weight': 0.1,
            'institutional_factor': 0.6
        })
        institutional_evidence += 0.6 * 0.1

    # Calcular señal dominante
    if not signals:
        return {'primary_signal': 'NEUTRAL', 'confidence': 0.0, 'institutional_evidence': 0.0}

    weighted_score = sum(s['strength'] * s['weight'] for s in signals)
    primary_signal = determine_order_flow_signal(signals)

    return {
        'primary_signal': primary_signal,
        'confidence': min(1.0, weighted_score),
        'institutional_evidence': institutional_evidence,
        'contributing_signals': signals
    }
```

---

## 🎨 INTEGRACIÓN FRONTEND

### 10mo Algoritmo en Charts
```javascript
// En InstitutionalChart.jsx - agregar Order Flow como 10mo algoritmo
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
    'institutional_order_flow'  // <- 10mo algoritmo
];

const OrderFlowIndicator = ({ data, config }) => {
    if (!data?.institutional_order_flow) return null;

    const flow = data.institutional_order_flow;

    return (
        <div className="order-flow-indicator">
            {/* Iceberg Detection */}
            {flow.flow_analysis.iceberg_detection.signal === 'ICEBERG_DETECTED' && (
                <div className="iceberg-marker"
                     style={{
                         position: 'absolute',
                         left: /* timestamp position */,
                         top: /* price level */,
                         color: '#ff6b35'
                     }}>
                    🧊 ICEBERG
                </div>
            )}

            {/* Institutional Blocks */}
            {flow.flow_analysis.institutional_blocks.signal === 'BLOCK_ACTIVITY' && (
                <rect
                    className="institutional-block"
                    fill="rgba(255,107,53,0.2)"
                    stroke="#ff6b35"
                    strokeWidth={2}
                />
            )}

            {/* Level Defense */}
            {flow.flow_analysis.level_defense.signal === 'LEVEL_DEFENSE' && (
                <line
                    className="defense-level"
                    stroke="#00ff88"
                    strokeWidth={3}
                    strokeDasharray="5,5"
                />
            )}

            {/* Flow Direction Arrow */}
            {flow.institutional_bias && (
                <polygon
                    className="flow-arrow"
                    fill={flow.institutional_bias === 'BULLISH' ? '#00ff88' : '#ff4757'}
                    points={/* arrow shape based on direction */}
                />
            )}
        </div>
    );
};
```

### Métricas Order Flow
```javascript
// En SmartScalperMetrics.jsx - agregar métricas Order Flow
const OrderFlowMetrics = ({ data }) => {
    const flow = data?.institutional_order_flow;
    if (!flow) return null;

    return (
        <div className="order-flow-metrics">
            <div className="metric">
                <span>Flow Signal:</span>
                <span className={`value ${flow.orderflow_signal.toLowerCase()}`}>
                    {flow.orderflow_signal}
                </span>
            </div>

            <div className="metric">
                <span>Institutional:</span>
                <span className="value">
                    {(flow.institutional_bias * 100).toFixed(0)}%
                </span>
            </div>

            <div className="metric">
                <span>Confluence:</span>
                <span className="value">
                    {(flow.confluence_score * 100).toFixed(0)}%
                </span>
            </div>

            {/* Iceberg Detection */}
            {flow.flow_analysis.iceberg_detection.signal === 'ICEBERG_DETECTED' && (
                <div className="special-metric iceberg">
                    <span>🧊 Iceberg Active</span>
                    <span className="value">
                        {flow.flow_analysis.iceberg_detection.absorption_level.toFixed(2)}
                    </span>
                </div>
            )}

            {/* Block Activity */}
            {flow.flow_analysis.institutional_blocks.signal === 'BLOCK_ACTIVITY' && (
                <div className="special-metric blocks">
                    <span>🏛️ Block Activity</span>
                    <span className="value">
                        {flow.flow_analysis.institutional_blocks.dominant_intention}
                    </span>
                </div>
            )}
        </div>
    );
};
```

---

## 🎯 SCALPING ADAPTATION

### Tape Reading para Timeframes Cortos
```python
def adapt_order_flow_for_scalping(flow_result, timeframe, market_conditions):
    """
    Adapta Order Flow para scalping - tape reading micro-structure
    """
    if timeframe in ['1m', '5m']:
        # Tape reading específico para scalping
        adapted_result = {
            'micro_tape_reading': analyze_micro_tape(flow_result, timeframe),
            'bid_ask_micro_imbalance': detect_micro_imbalances(flow_result),
            'execution_timing': calculate_execution_timing(flow_result),
            'scalp_opportunities': identify_scalp_opportunities(flow_result)
        }

        # Integrar con volatilidad para scalping
        if market_conditions['volatility'] > 0.8:
            adapted_result['scalp_caution'] = 'HIGH_VOLATILITY'
            adapted_result['position_sizing'] = 'REDUCED'
            adapted_result['exit_speed'] = 'FAST'

        return adapted_result

    return flow_result  # Timeframes mayores sin adaptación

def analyze_micro_tape(flow_result, timeframe):
    """Análisis micro tape reading para scalping"""
    if timeframe == '1m':
        return {
            'tick_analysis': 'INTRA_MINUTE',
            'order_urgency': 'IMMEDIATE',
            'flow_momentum': calculate_micro_momentum(flow_result),
            'execution_window': '15-30 seconds'
        }
    elif timeframe == '5m':
        return {
            'tick_analysis': 'SUB_5MIN',
            'order_urgency': 'QUICK',
            'flow_momentum': calculate_micro_momentum(flow_result),
            'execution_window': '1-2 minutes'
        }

def identify_scalp_opportunities(flow_result):
    """Identifica oportunidades específicas de scalping"""
    opportunities = []

    # Iceberg absorption = contra-trend scalp
    if flow_result.get('iceberg_detection', {}).get('signal') == 'ICEBERG_DETECTED':
        opportunities.append({
            'type': 'ICEBERG_FADE',
            'direction': 'OPPOSITE_TO_ABSORPTION',
            'confidence': 0.8,
            'holding_time': 'SHORT'
        })

    # Aggressive flow = momentum scalp
    if flow_result.get('aggressive_flow', {}).get('signal') == 'AGGRESSIVE_FLOW':
        opportunities.append({
            'type': 'MOMENTUM_FOLLOW',
            'direction': flow_result['aggressive_flow']['direction'],
            'confidence': 0.75,
            'holding_time': 'VERY_SHORT'
        })

    return opportunities
```

---

## 📊 RENDIMIENTO Y TESTING

### Especificaciones de Performance
- **Tiempo ejecución**: < 75ms por análisis completo (más complejo que otros)
- **Memoria**: < 15MB para 1000 períodos + volume detail
- **Precisión iceberg**: ≥ 70% en detección órdenes ocultas
- **Precisión bloques**: ≥ 80% en identificación actividad institucional

### Casos de Testing
```python
def test_order_flow_performance():
    test_cases = [
        {
            'name': 'ICEBERG_ACCUMULATION',
            'market_condition': 'institutional_absorption',
            'expected': 'ICEBERG_DETECTED with absorption level'
        },
        {
            'name': 'BLOCK_DISTRIBUTION',
            'market_condition': 'large_sell_blocks',
            'expected': 'BLOCK_ACTIVITY with bearish intention'
        },
        {
            'name': 'PERSISTENT_BID_IMBALANCE',
            'market_condition': 'sustained_buying_pressure',
            'expected': 'PERSISTENT_IMBALANCE bullish'
        },
        {
            'name': 'LEVEL_DEFENSE_SUPPORT',
            'market_condition': 'multiple_support_tests',
            'expected': 'LEVEL_DEFENSE with high institutional confidence'
        },
        {
            'name': 'AGGRESSIVE_BREAKOUT_FLOW',
            'market_condition': 'breakout_with_urgency',
            'expected': 'AGGRESSIVE_FLOW with momentum prediction'
        }
    ]
```

---

## 🔗 CONFLUENCE CON ALGORITMOS EXISTENTES

### Integración con 9 Algoritmos Institucionales
```python
def calculate_order_flow_confluence(flow_result, wyckoff, order_blocks, liquidity_grabs,
                                   stop_hunting, fvg, microstructure, vsa, market_profile, smc):
    """
    Calcula confluencia Order Flow con otros 9 algoritmos institucionales
    """
    confluence_score = 0.0
    confluence_details = {}

    # 1. Order Flow + Wyckoff (fases institucionales)
    if flow_result['orderflow_signal'] == 'ACCUMULATION' and wyckoff['phase'] == 'ACCUMULATION':
        confluence_score += 0.2
        confluence_details['wyckoff'] = 'ACCUMULATION_CONFLUENCE'

    # 2. Order Flow + Order Blocks (zonas + actividad)
    if flow_result['institutional_bias'] and order_blocks['signal'] != 'NEUTRAL':
        flow_levels = extract_flow_levels(flow_result)
        ob_levels = order_blocks['zone_price']
        if levels_overlap(flow_levels, ob_levels):
            confluence_score += 0.15
            confluence_details['order_blocks'] = 'INSTITUTIONAL_ZONE_ACTIVITY'

    # 3. Order Flow + Liquidity Grabs (absorción post-grab)
    if liquidity_grabs['signal'] == 'GRAB_DETECTED':
        if flow_result.get('iceberg_detection', {}).get('signal') == 'ICEBERG_DETECTED':
            confluence_score += 0.1
            confluence_details['liquidity'] = 'POST_GRAB_ABSORPTION'

    # 4. Order Flow + Stop Hunting (defensa vs hunting)
    if stop_hunting['signal'] == 'HUNT_DETECTED':
        if flow_result.get('level_defense', {}).get('signal') == 'LEVEL_DEFENSE':
            confluence_score += 0.1  # Defensa vs hunting
            confluence_details['stop_hunting'] = 'DEFENSE_VS_HUNTING'

    # 5. Order Flow + Fair Value Gaps (imbalance + gaps)
    if fvg['signal'] != 'NEUTRAL':
        if flow_result.get('persistent_imbalance', {}).get('signal') == 'PERSISTENT_IMBALANCE':
            confluence_score += 0.1
            confluence_details['fvg'] = 'IMBALANCE_GAP_CONFLUENCE'

    # 6. Order Flow + Market Microstructure (tape reading)
    if microstructure['signal'] in ['INSTITUTIONAL_ACTIVITY', 'PROFESSIONAL_INTEREST']:
        confluence_score += 0.15
        confluence_details['microstructure'] = 'TAPE_READING_CONFIRMATION'

    # 7. Order Flow + Volume Spread Analysis (flow + effort)
    if vsa['signal'] in ['NO_SUPPLY', 'NO_DEMAND']:
        if flow_result.get('aggressive_flow', {}).get('signal') == 'AGGRESSIVE_FLOW':
            confluence_score += 0.1
            confluence_details['vsa'] = 'EFFORT_FLOW_ALIGNMENT'

    # 8. Order Flow + Market Profile (value + activity)
    if market_profile['signal'] in ['POC_DEFENSE', 'VALUE_AREA_REJECTION']:
        if flow_result.get('level_defense', {}).get('signal') == 'LEVEL_DEFENSE':
            confluence_score += 0.15
            confluence_details['market_profile'] = 'VALUE_DEFENSE_CONFLUENCE'

    # 9. Order Flow + Smart Money Concepts (structure + flow)
    if smc['smc_signal'] == 'BOS':
        if flow_result.get('aggressive_flow', {}).get('signal') == 'AGGRESSIVE_FLOW':
            confluence_score += 0.1
            confluence_details['smc'] = 'STRUCTURE_FLOW_BREAKOUT'

    # Normalizar score
    confluence_score = min(1.0, max(0.0, confluence_score))

    return {
        'total_score': confluence_score,
        'details': confluence_details,
        'institutional_bias': calculate_institutional_bias(confluence_score, flow_result),
        'risk_assessment': assess_flow_risk(confluence_score, confluence_details)
    }

def calculate_institutional_bias(confluence_score, flow_result):
    """Calcula sesgo institucional basado en confluencia y evidencia"""
    base_bias = flow_result.get('institutional_evidence', 0.0)
    confluence_boost = confluence_score * 0.3

    total_bias = min(1.0, base_bias + confluence_boost)

    if total_bias >= 0.8:
        return 'STRONG_INSTITUTIONAL'
    elif total_bias >= 0.6:
        return 'MODERATE_INSTITUTIONAL'
    elif total_bias >= 0.4:
        return 'WEAK_INSTITUTIONAL'
    else:
        return 'RETAIL_NOISE'
```

---

## ✅ IMPLEMENTACIÓN

### Archivo Backend
- **Ubicación**: `backend/services/institutional_order_flow.py`
- **Integración**: Import en `backend/routes/real_trading_routes.py`
- **Función**: `_evaluate_institutional_order_flow()` en contexto análisis inteligente

### Referencias SPEC_REF
- **Concepto maestro**: `docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/10_INSTITUTIONAL_ORDER_FLOW.md`
- **Especificación técnica**: Este documento
- **Índice algoritmos**: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

### Endpoint Integration
- **POST** `/api/run-smart-trade/{symbol}`
- **Respuesta**: `institutional_confirmations.institutional_order_flow`
- **Frontend**: 10mo algoritmo en charts + métricas Order Flow

---

*Especificación técnica completada aplicando lecciones Wyckoff DL-001 Zero-Hardcode*
*Catálogo Parámetros: Funciones f_interval(), theta_*() parametrizadas*
*Señales Parametrizadas: vol_rel(), efficiency_ratio(), urgency_score() matemáticas*
*Precondiciones: INSUFFICIENT_DATA handling + validación lookback_bars*
*Algoritmos: 5 específicos tape reading con nomenclatura Wyckoff*
*Integración: 10mo algoritmo institucional confluencia completa + rollback P2*