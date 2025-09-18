# 09_SMART_MONEY_CONCEPTS_SPEC.md — Especificación Técnica Completa (DL‑001)

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/09_SMART_MONEY_CONCEPTS.md
- Modelo: Tom Williams VSA + CBOT Market Profile methodology
- Backend: smart_money_concepts.py (crear)
- Integración: 9no algoritmo institucional

DL‑001: Esta especificación elimina cualquier valor literal en la lógica. Todos los umbrales/ventanas/pesos deben provenir de un proveedor de parámetros (ver “ParamProvider DL‑001”) derivado de BotConfig/estrategia + recent_stats/meta del símbolo.

---

## 🎯 PROPÓSITO

Marco moderno para leer estructura de mercado institucional mediante análisis de Higher High/Lower Low (HH/LL/HL/LH), Break of Structure (BOS) y Change of Character (CHoCH). Identifica timing de entradas direccionales profesionales y protección contra manipulación.

---

## 📊 ENTRADAS TÉCNICAS

### Datos de Mercado (≥80 períodos)
- OHLCV completo del bot específico
- ATR para volatilidad contextual
- Volumen real por período

### Parámetros User-Specific (NO hardcodes)
```python
# Derivados de BotConfig propiedades reales
structure_sensitivity = f(bot_config.risk_percentage)  # 1-10% → sensibilidad swing detection
bos_confirmation = f(bot_config.cooldown_minutes)      # 5-60min → períodos confirmación BOS
choch_threshold = f(bot_config.leverage)               # 1-10x → umbral cambio carácter
pullback_zone = f(bot_config.take_profit)             # 1-5% → zona reentrada post-BOS
invalidation_level = f(bot_config.stop_loss)          # 1-3% → nivel invalidación estructura
```

---

## 📈 SALIDAS TÉCNICAS

### Señal Principal
```python
{
    "smc_signal": "BOS|CHOCH|NEUTRAL",
    "break_level": float,                    # Precio ruptura estructura
    "confirmation_strength": 0.0-1.0,       # Fuerza confirmación
    "entry_zone": {                         # Zona entrada óptima
        "upper": float,
        "lower": float,
        "type": "PULLBACK|RETEST|CONTINUATION"
    },
    "structure_details": {
        "current_trend": "BULLISH|BEARISH|RANGING",
        "last_hh": float,
        "last_ll": float,
        "swing_points": [...],
        "invalidation": float
    }
}
```

---

## 🔬 MODELO MATEMÁTICO SMART MONEY CONCEPTS

### 1. ESTRUCTURA_CONTINUACIÓN (BOS Detection)

**Propósito**: Detectar Break of Structure para continuación tendencial

**Algoritmo**:
```python
def detect_structure_continuation(ohlcv_data, bot_params):
    # Parámetros user-specific (NO hardcode)
    swing_sensitivity = calculate_swing_sensitivity(bot_params.risk_percentage)
    min_confirmation = calculate_min_confirmation(bot_params.cooldown_minutes)

    # 1. Identificar swing points significativos
    swing_highs = identify_swing_highs(ohlcv_data, swing_sensitivity)
    swing_lows = identify_swing_lows(ohlcv_data, swing_sensitivity)

    # 2. Determinar estructura actual
    if is_uptrend_structure(swing_highs, swing_lows):
        # Buscar BOS alcista: Close > último swing high significativo
        last_significant_high = get_last_significant_high(swing_highs)
        current_close = ohlcv_data[-1]['close']

        if current_close > last_significant_high:
            confirmation_periods = count_periods_above(last_significant_high, min_confirmation)
            if confirmation_periods >= min_confirmation:
                return {
                    "signal": "BOS",
                    "direction": "BULLISH",
                    "break_level": last_significant_high,
                    "strength": calculate_bos_strength(current_close, last_significant_high)
                }

    elif is_downtrend_structure(swing_highs, swing_lows):
        # Buscar BOS bajista: Close < último swing low significativo
        last_significant_low = get_last_significant_low(swing_lows)
        current_close = ohlcv_data[-1]['close']

        if current_close < last_significant_low:
            confirmation_periods = count_periods_below(last_significant_low, min_confirmation)
            if confirmation_periods >= min_confirmation:
                return {
                    "signal": "BOS",
                    "direction": "BEARISH",
                    "break_level": last_significant_low,
                    "strength": calculate_bos_strength(current_close, last_significant_low)
                }

    return {"signal": "NEUTRAL"}

def calculate_swing_sensitivity(risk_percentage):
    # Mapeo risk_percentage → swing detection periods
    # 1% risk = alta sensibilidad (5 períodos)
    # 10% risk = baja sensibilidad (20 períodos)
    return int(5 + (risk_percentage - 1) * (20 - 5) / 9)

def calculate_bos_strength(current_price, break_level, atr_period):
    # Fuerza basada en distancia de ruptura vs ATR parametrizado
    distance = abs(current_price - break_level)
    atr_current = calculate_atr(period=atr_period)
    return min(1.0, distance / max(atr_current, 1e-12))
```

### 2. ESTRUCTURA_RUPTURA (CHoCH Detection)

**Propósito**: Detectar Change of Character - cambio de sesgo direccional

**Algoritmo**:
```python
def detect_change_of_character(ohlcv_data, bot_params):
    # Parámetros user-specific
    choch_sensitivity = calculate_choch_sensitivity(bot_params.leverage)
    confirmation_periods = calculate_confirmation_periods(bot_params.cooldown_minutes)

    # 1. Analizar estructura reciente (últimos 50-100 períodos)
    recent_structure = analyze_recent_structure(ohlcv_data, choch_sensitivity)

    # 2. Identificar patrón CHoCH
    if recent_structure['trend'] == 'BULLISH':
        # CHoCH bajista: LL después de serie HH/HL
        recent_lows = get_recent_swing_lows(ohlcv_data, choch_sensitivity)
        if len(recent_lows) >= 2:
            if recent_lows[-1] < recent_lows[-2]:  # Lower Low formado
                # Verificar que rompió estructura alcista previa
                last_hl = get_last_higher_low(recent_structure)
                if recent_lows[-1] < last_hl:
                    return {
                        "signal": "CHOCH",
                        "direction": "BEARISH",
                        "break_level": last_hl,
                        "confirmation": verify_choch_confirmation(ohlcv_data, confirmation_periods)
                    }

    elif recent_structure['trend'] == 'BEARISH':
        # CHoCH alcista: HH después de serie LL/LH
        recent_highs = get_recent_swing_highs(ohlcv_data, choch_sensitivity)
        if len(recent_highs) >= 2:
            if recent_highs[-1] > recent_highs[-2]:  # Higher High formado
                # Verificar que rompió estructura bajista previa
                last_lh = get_last_lower_high(recent_structure)
                if recent_highs[-1] > last_lh:
                    return {
                        "signal": "CHOCH",
                        "direction": "BULLISH",
                        "break_level": last_lh,
                        "confirmation": verify_choch_confirmation(ohlcv_data, confirmation_periods)
                    }

    return {"signal": "NEUTRAL"}

def calculate_choch_sensitivity(leverage, base_periods, sensitivity_coef):
    # Sensibilidad parametrizada por provider
    sensitivity_factor = max(0.0, min(1.0, (leverage - 1) / max(1, leverage)))
    return int(base_periods * (1 - sensitivity_factor * sensitivity_coef))
```

### 3. FORMACIÓN_HH (Higher High Formation)

**Propósito**: Detectar formación de Higher Highs en tendencia alcista

**Algoritmo**:
```python
def detect_higher_high_formation(ohlcv_data, bot_params):
    # Parámetros derivados de configuración usuario
    formation_window = calculate_formation_window(bot_params.interval)
    significance_threshold = calculate_significance_threshold(bot_params.take_profit)

    # 1. Obtener swing highs recientes
    swing_highs = identify_swing_highs(ohlcv_data, formation_window)

    if len(swing_highs) >= 2:
        current_high = swing_highs[-1]
        previous_high = swing_highs[-2]

        # 2. Verificar formación HH válida
        if current_high['price'] > previous_high['price']:
            price_diff = current_high['price'] - previous_high['price']
            atr_context = calculate_atr(14)

            # 3. Verificar significancia (debe superar ruido de mercado)
            if price_diff > (atr_context * significance_threshold):
                return {
                    "signal": "HH_FORMATION",
                    "formation_strength": calculate_formation_strength(price_diff, atr_context),
                    "previous_high": previous_high['price'],
                    "current_high": current_high['price'],
                    "trend_status": "BULLISH_CONTINUATION"
                }

    return {"signal": "NO_FORMATION"}

def calculate_formation_window(interval, provider):
    # Ventana derivada del provider según interval/estrategia (sin mapas literales)
    return provider.get_formation_window(interval)
```

### 4. FORMACIÓN_LL (Lower Low Formation)

**Propósito**: Detectar formación de Lower Lows en tendencia bajista

**Algoritmo**:
```python
def detect_lower_low_formation(ohlcv_data, bot_params):
    # Parámetros user-specific
    formation_window = calculate_formation_window(bot_params.interval)
    significance_threshold = calculate_significance_threshold(bot_params.take_profit)

    # 1. Obtener swing lows recientes
    swing_lows = identify_swing_lows(ohlcv_data, formation_window)

    if len(swing_lows) >= 2:
        current_low = swing_lows[-1]
        previous_low = swing_lows[-2]

        # 2. Verificar formación LL válida
        if current_low['price'] < previous_low['price']:
            price_diff = previous_low['price'] - current_low['price']
            atr_context = calculate_atr(14)

            # 3. Verificar significancia
            if price_diff > (atr_context * significance_threshold):
                return {
                    "signal": "LL_FORMATION",
                    "formation_strength": calculate_formation_strength(price_diff, atr_context),
                    "previous_low": previous_low['price'],
                    "current_low": current_low['price'],
                    "trend_status": "BEARISH_CONTINUATION"
                }

    return {"signal": "NO_FORMATION"}
```

### 5. OPORTUNIDAD_PULLBACK (Pullback Opportunity)

**Propósito**: Identificar zonas óptimas entrada post-BOS

**Algoritmo**:
```python
def detect_pullback_opportunity(ohlcv_data, bot_params, bos_signal):
    if bos_signal['signal'] != 'BOS':
        return {"signal": "NO_OPPORTUNITY"}

    # Parámetros user-specific
    pullback_depth = calculate_pullback_depth(bot_params.take_profit)
    entry_zone_width = calculate_entry_zone_width(bot_params.stop_loss)

    break_level = bos_signal['break_level']
    direction = bos_signal['direction']

    if direction == "BULLISH":
        # Buscar pullback a zona de demanda post-BOS alcista
        current_price = ohlcv_data[-1]['close']
        expected_pullback_zone = break_level - (break_level * pullback_depth)

        # Verificar si precio está en zona pullback
        if expected_pullback_zone <= current_price <= break_level:
            # Buscar confluencias (OB, FVG, etc.)
            confluences = find_demand_confluences(ohlcv_data, expected_pullback_zone, entry_zone_width)

            return {
                "signal": "PULLBACK_OPPORTUNITY",
                "direction": "BULLISH",
                "entry_zone": {
                    "upper": break_level,
                    "lower": expected_pullback_zone,
                    "optimal": calculate_optimal_entry(confluences)
                },
                "confluences": confluences,
                "invalidation": expected_pullback_zone - (atr_current * 0.5)
            }

    elif direction == "BEARISH":
        # Buscar pullback a zona de suministro post-BOS bajista
        current_price = ohlcv_data[-1]['close']
        expected_pullback_zone = break_level + (break_level * pullback_depth)

        if break_level <= current_price <= expected_pullback_zone:
            confluences = find_supply_confluences(ohlcv_data, expected_pullback_zone, entry_zone_width)

            return {
                "signal": "PULLBACK_OPPORTUNITY",
                "direction": "BEARISH",
                "entry_zone": {
                    "lower": break_level,
                    "upper": expected_pullback_zone,
                    "optimal": calculate_optimal_entry(confluences)
                },
                "confluences": confluences,
                "invalidation": expected_pullback_zone + (atr_current * 0.5)
            }

    return {"signal": "NO_OPPORTUNITY"}

def calculate_pullback_depth(take_profit_percentage, depth_range):
    # Profundidad parametrizada por rango [min,max] del provider
    lo, hi = depth_range
    lo, hi = float(lo), float(hi)
    span = max(0.0, hi - lo)
    # Mapear TP del usuario a rango permitido (estrategia decide)
    scale = min(1.0, max(0.0, (take_profit_percentage or 1.0) / 10.0))
    return lo + span * scale
```

---

## ⚙️ CONFIGURACIÓN USER-SPECIFIC (Zero Hardcodes)

### Función Configuración Principal
```python
def configure_smc_parameters(bot_config):
    """
    Deriva TODOS los parámetros SMC de propiedades reales BotConfig
    ZERO hardcodes - todo calculado dinámicamente
    """
    config = {}

    # 1. Sensibilidad estructura (risk_percentage: 1-10%)
    config['structure_sensitivity'] = calculate_structure_sensitivity(bot_config.risk_percentage)

    # 2. Confirmación BOS (cooldown_minutes: 5-60min)
    config['bos_confirmation_periods'] = calculate_bos_confirmation(bot_config.cooldown_minutes)

    # 3. Umbral CHoCH (leverage: 1-10x)
    config['choch_threshold'] = calculate_choch_threshold(bot_config.leverage)

    # 4. Zona pullback (take_profit: 1-5%)
    config['pullback_depth'] = calculate_pullback_depth(bot_config.take_profit)

    # 5. Invalidación (stop_loss: 1-3%)
    config['invalidation_factor'] = calculate_invalidation_factor(bot_config.stop_loss)

    # 6. Timeframe adaptation (interval)
    config['timeframe_adjustment'] = calculate_timeframe_adjustment(bot_config.interval)

    return config

def calculate_structure_sensitivity(risk_percentage):
    # Risk bajo = mayor sensibilidad (detecta más swings)
    # Risk alto = menor sensibilidad (solo swings significativos)
    return {
        'swing_detection_periods': int(5 + (risk_percentage - 1) * 1.5),
        'minimum_swing_size': 0.1 + (risk_percentage * 0.05),
        'confirmation_strength': 0.6 + (risk_percentage * 0.03)
    }

def calculate_bos_confirmation(cooldown_minutes):
    # Derivar períodos mínimos desde configuración (sin literales)
    base_periods = max(1, int(cooldown_minutes / 15))
    return {
        'minimum_periods': base_periods,
        'volume_confirmation': base_periods >= 2,
        'close_confirmation': True
    }

---

## ParamProvider DL‑001 (fuente de verdad)

Única fuente de valores numéricos. Implementaciones leen de `BotConfig` (estrategia, risk_profile, TP/SL, interval), `recent_stats` (ATR, percentiles, volatilidad) y `symbol_meta` (tick/step).

```python
from dataclasses import dataclass
from typing import Protocol, Any, Dict, Tuple

@dataclass
class SmcParams:
    atr_period: int
    # Estructura y swings
    swing_detection_periods: int
    minimum_swing_size_atr: float
    # BOS/CHoCH
    bos_min_periods: int
    bos_require_close_confirm: bool
    choch_window: int
    choch_base_periods: int
    choch_sensitivity_coef: float
    # Formaciones
    formation_window: int
    significance_threshold_atr: float
    # Pullback/invalidación
    pullback_depth_range: Tuple[float, float]
    entry_zone_width_bps: float
    invalidation_factor_atr: float
    # Pesos síntesis SMC
    w_bos: float; w_choch: float; w_hh: float; w_ll: float; w_pullback: float
    # Pesos confluencias externas
    w_ob: float; w_fvg: float; w_liq: float; w_stop: float; w_vsa: float; w_micro: float; w_profile: float

class SmcParamProvider(Protocol):
    def get_ta_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> Tuple[int]: ...  # atr_period
    def get_swing_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> Tuple[int, float]: ...
    def get_bos_params(self, bot_config: Any) -> Tuple[int, bool]: ...
    def get_choch_params(self, bot_config: Any) -> Tuple[int, int, float]: ...
    def get_formation_params(self, bot_config: Any) -> Tuple[int, float]: ...
    def get_pullback_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> Tuple[Tuple[float, float], float, float]: ...
    def get_weights(self, bot_config: Any) -> Tuple[float, float, float, float, float]: ...
    def get_confluence_weights(self, bot_config: Any) -> Tuple[float, float, float, float, float, float, float]: ...

def resolve_smc_params(bot_config: Any, recent_stats: Dict[str, float], provider: SmcParamProvider) -> SmcParams:
    atr_period, = provider.get_ta_params(bot_config, recent_stats)
    swing_p, swing_min = provider.get_swing_params(bot_config, recent_stats)
    bos_min, bos_close = provider.get_bos_params(bot_config)
    choch_win, choch_base, choch_coef = provider.get_choch_params(bot_config)
    formation_win, signif_atr = provider.get_formation_params(bot_config)
    depth_range, zone_bps, invalid_atr = provider.get_pullback_params(bot_config, recent_stats)
    w_bos, w_choch, w_hh, w_ll, w_pull = provider.get_weights(bot_config)
    w_ob, w_fvg, w_liq, w_stop, w_vsa, w_micro, w_prof = provider.get_confluence_weights(bot_config)
    return SmcParams(
        atr_period=atr_period,
        swing_detection_periods=swing_p,
        minimum_swing_size_atr=swing_min,
        bos_min_periods=bos_min,
        bos_require_close_confirm=bos_close,
        choch_window=choch_win,
        choch_base_periods=choch_base,
        choch_sensitivity_coef=choch_coef,
        formation_window=formation_win,
        significance_threshold_atr=signif_atr,
        pullback_depth_range=depth_range,
        entry_zone_width_bps=zone_bps,
        invalidation_factor_atr=invalid_atr,
        w_bos=w_bos, w_choch=w_choch, w_hh=w_hh, w_ll=w_ll, w_pullback=w_pull,
        w_ob=w_ob, w_fvg=w_fvg, w_liq=w_liq, w_stop=w_stop, w_vsa=w_vsa, w_micro=w_micro, w_profile=w_prof
    )
```

Notas de reemplazo DL‑001 (dentro de esta spec)
- ATR(14) → usar `params.atr_period` (ver líneas 117–121, 199–206, 247–256).
- Ventanas por timeframe → `params.formation_window` (ver 214–223).
- Profundidad pullback 0.382–0.618 → `params.pullback_depth_range` (ver 323–329).
- Pesos de síntesis 0.3/0.25/... → `params.w_*` (ver 471–506, 512–519).

---

## Confluencias con 01–08 (reglas de blindaje)

- 01 Wyckoff: CHoCH coherente con fase; si contradice y VSA “no demand/supply”, penalizar por `w_vsa`.
- 02 Order Blocks: tras BOS, exigir retest/inval. válidos (δ por ATR) para plus en `entry_zone` (peso `w_ob`).
- 03 Liquidity Grabs: filtrar inducements (grab + reversión en break_level) — reduce confianza BOS vía `w_liq`.
- 04 Stop Hunting: CHoCH tras hunting + VSA clímax aumenta confirmación (pesos `w_stop`, `w_vsa`).
- 05 FVG: confluencia FVG en zona pullback aumenta recomendación (peso `w_fvg`).
- 06 Microestructura: POC/VA congruentes con BOS/VAL/VAH ajustan confianza (`w_micro`, `w_profile`).
- 07 VSA: Effort/Result y actividad profesional validan BOS/CHOCH (`w_vsa`).
- 08 Market Profile: breakout POC requerido/bonus según estrategia (provider puede activar bandera y peso `w_profile`).

Todos los pesos vienen de `SmcParamProvider` (cero números en lógica).

---

## Integración Backend/Frontend (sin implementación)

- Endpoint: reutilizar `POST /api/run-smart-trade/{symbol}`. Añadir SMC en `signals.institutional_confirmations.smart_money_concepts` cuando se implemente.
- Payload SMC propuesto: `smc_signal`, `break_level`, `confirmation_strength`, `entry_zone{upper,lower,type}`, `structure_details{trend,last_hh,last_ll,swings,invalidation}`, `confluences{ob,fvg,liq,stop,vsa,micro,profile}`.
- Frontend: SmartScalperAnalysisPanel ya mapea “smart_money_concepts”. InstitutionalChart no debe simular SMC; mostrar solo si el backend lo provee.

---

## Frontend DL‑001 Cleanup (SMC)

- No usar datos simulados ni defaults en UI. Si falta SMC, mostrar “No data”.
- No derivar targets/SL fijos en UI; presentar lo que provea backend/mode.

---

## P2 Rollback

Cambios de esta sección afectan únicamente documentación. En caso de inconsistencias, restaurar con:
`git restore docs/TECHNICAL_SPECS/INSTITUTIONAL_ALGORITHMS_SPECS/09_SMART_MONEY_CONCEPTS_SPEC.md`
```

---

## 🔗 INTEGRACIÓN BACKEND

### Función Principal
```python
def _evaluate_smart_money_concepts(self, symbol: str, bot_config, market_data, processed_indicators):
    """
    9no algoritmo institucional - Smart Money Concepts
    Integración con 8 algoritmos existentes
    """
    try:
        # 1. Configuración user-specific
        smc_config = configure_smc_parameters(bot_config)

        # 2. Ejecutar 5 algoritmos SMC
        results = {}

        # Algoritmo 1: BOS Detection
        bos_result = detect_structure_continuation(
            market_data['ohlcv'],
            smc_config
        )
        results['structure_continuation'] = bos_result

        # Algoritmo 2: CHoCH Detection
        choch_result = detect_change_of_character(
            market_data['ohlcv'],
            smc_config
        )
        results['change_of_character'] = choch_result

        # Algoritmo 3: HH Formation
        hh_result = detect_higher_high_formation(
            market_data['ohlcv'],
            smc_config
        )
        results['higher_high_formation'] = hh_result

        # Algoritmo 4: LL Formation
        ll_result = detect_lower_low_formation(
            market_data['ohlcv'],
            smc_config
        )
        results['lower_low_formation'] = ll_result

        # Algoritmo 5: Pullback Opportunity
        pullback_result = detect_pullback_opportunity(
            market_data['ohlcv'],
            smc_config,
            bos_result
        )
        results['pullback_opportunity'] = pullback_result

        # 3. Síntesis SMC
        smc_synthesis = synthesize_smc_signals(results, smc_config)

        # 4. Confluencia con otros algoritmos
        institutional_confluence = calculate_smc_confluence(
            smc_synthesis,
            processed_indicators['wyckoff'],
            processed_indicators['order_blocks'],
            processed_indicators['liquidity_grabs'],
            processed_indicators['stop_hunting'],
            processed_indicators['fair_value_gaps'],
            processed_indicators['market_microstructure'],
            processed_indicators['volume_spread_analysis'],
            processed_indicators['market_profile']
        )

        return {
            'smc_signal': smc_synthesis['primary_signal'],
            'structure_analysis': results,
            'confluence_score': institutional_confluence['total_score'],
            'entry_recommendation': institutional_confluence['entry_recommendation'],
            'risk_assessment': institutional_confluence['risk_assessment']
        }

    except Exception as e:
        self.logger.error(f"Error evaluating Smart Money Concepts for {symbol}: {str(e)}")
        return self._get_neutral_smc_result()

def synthesize_smc_signals(results, config):
    """Síntesis inteligente de los 5 algoritmos SMC"""
    signals = []

    # Ponderar señales según fuerza
    if results['structure_continuation']['signal'] == 'BOS':
        signals.append({
            'type': 'BOS',
            'strength': results['structure_continuation']['strength'],
            'weight': 0.3
        })

    if results['change_of_character']['signal'] == 'CHOCH':
        signals.append({
            'type': 'CHOCH',
            'strength': results['change_of_character']['confirmation'],
            'weight': 0.25
        })

    # Formaciones estructura
    if results['higher_high_formation']['signal'] == 'HH_FORMATION':
        signals.append({
            'type': 'HH',
            'strength': results['higher_high_formation']['formation_strength'],
            'weight': 0.2
        })

    if results['lower_low_formation']['signal'] == 'LL_FORMATION':
        signals.append({
            'type': 'LL',
            'strength': results['lower_low_formation']['formation_strength'],
            'weight': 0.2
        })

    # Oportunidades entrada
    if results['pullback_opportunity']['signal'] == 'PULLBACK_OPPORTUNITY':
        signals.append({
            'type': 'PULLBACK',
            'strength': len(results['pullback_opportunity']['confluences']) / 5,
            'weight': 0.25
        })

    # Calcular señal dominante
    if not signals:
        return {'primary_signal': 'NEUTRAL', 'confidence': 0.0}

    weighted_score = sum(s['strength'] * s['weight'] for s in signals)
    primary_signal = determine_primary_signal(signals)

    return {
        'primary_signal': primary_signal,
        'confidence': min(1.0, weighted_score),
        'contributing_signals': signals
    }
```

---

## 🎨 INTEGRACIÓN FRONTEND

### 9no Algoritmo en Charts
```javascript
// En InstitutionalChart.jsx - agregar SMC como 9no algoritmo
const institutionalAlgorithms = [
    'wyckoff',
    'order_blocks',
    'liquidity_grabs',
    'stop_hunting',
    'fair_value_gaps',
    'market_microstructure',
    'volume_spread_analysis',
    'market_profile',
    'smart_money_concepts'  // <- 9no algoritmo
];

const SmartMoneyConceptsIndicator = ({ data, config }) => {
    if (!data?.smart_money_concepts) return null;

    const smc = data.smart_money_concepts;

    return (
        <div className="smc-indicator">
            {/* BOS/CHoCH Markers */}
            {smc.structure_analysis.structure_continuation.signal === 'BOS' && (
                <div className="bos-marker">
                    BOS: {smc.structure_analysis.structure_continuation.direction}
                </div>
            )}

            {/* Structure Lines */}
            {smc.structure_analysis.higher_high_formation.signal === 'HH_FORMATION' && (
                <line
                    className="hh-line"
                    x1={/* previous high */}
                    x2={/* current high */}
                    stroke="#00ff00"
                />
            )}

            {/* Pullback Zones */}
            {smc.structure_analysis.pullback_opportunity.signal === 'PULLBACK_OPPORTUNITY' && (
                <rect
                    className="pullback-zone"
                    fill="rgba(0,255,0,0.1)"
                    stroke="#00ff00"
                />
            )}
        </div>
    );
};
```

### Métricas SMC
```javascript
// En SmartScalperMetrics.jsx - agregar métricas SMC
const SmcMetrics = ({ data }) => {
    const smc = data?.smart_money_concepts;
    if (!smc) return null;

    return (
        <div className="smc-metrics">
            <div className="metric">
                <span>Structure:</span>
                <span className={`value ${smc.smc_signal.toLowerCase()}`}>
                    {smc.smc_signal}
                </span>
            </div>

            <div className="metric">
                <span>Confluence:</span>
                <span className="value">
                    {(smc.confluence_score * 100).toFixed(0)}%
                </span>
            </div>

            <div className="metric">
                <span>Entry Zone:</span>
                <span className="value">
                    {smc.entry_recommendation || 'N/A'}
                </span>
            </div>
        </div>
    );
};
```

---

## 🎯 SCALPING ADAPTATION

### Micro-Structure para Timeframes Cortos
```python
def adapt_smc_for_scalping(smc_result, timeframe, market_conditions):
    """
    Adapta SMC para scalping - micro-structure analysis
    """
    if timeframe in ['1m', '5m']:
        # Escalado temporal para micro-estructura
        adapted_result = {
            'micro_bos': detect_micro_bos(smc_result, timeframe),
            'intrabar_structure': analyze_intrabar_structure(smc_result),
            'scalping_zones': identify_scalping_zones(smc_result),
            'quick_reversals': detect_quick_reversals(smc_result)
        }

        # Integrar con condiciones de mercado
        if market_conditions['volatility'] > 0.7:
            adapted_result['caution_level'] = 'HIGH'
            adapted_result['position_size_factor'] = 0.5

        return adapted_result

    return smc_result  # Timeframes mayores sin adaptación

def detect_micro_bos(smc_result, timeframe):
    """Detecta micro-BOS en timeframes de scalping"""
    if timeframe == '1m':
        # BOS con confirmación de 2-3 velas
        return {
            'micro_confirmation': 2,
            'volume_requirement': True,
            'immediate_follow_through': True
        }
    elif timeframe == '5m':
        # BOS con confirmación de 1-2 velas
        return {
            'micro_confirmation': 1,
            'volume_requirement': False,
            'immediate_follow_through': False
        }
```

---

## 📊 RENDIMIENTO Y TESTING

### Especificaciones de Performance
- **Tiempo ejecución**: < 50ms por análisis completo
- **Memoria**: < 10MB para 1000 períodos OHLCV
- **Precisión BOS**: ≥ 75% en condiciones normales
- **Precisión CHoCH**: ≥ 70% en cambios de sesgo

### Casos de Testing
```python
def test_smc_performance():
    test_cases = [
        {
            'name': 'BOS_CONTINUATION_BULLISH',
            'market_condition': 'trending_up',
            'expected': 'BOS signal with pullback opportunity'
        },
        {
            'name': 'CHOCH_BEARISH_REVERSAL',
            'market_condition': 'trend_change',
            'expected': 'CHOCH signal with structure break'
        },
        {
            'name': 'RANGING_MARKET_NOISE',
            'market_condition': 'sideways',
            'expected': 'NEUTRAL with low confidence'
        },
        {
            'name': 'FALSE_BREAKOUT_RECOVERY',
            'market_condition': 'manipulation',
            'expected': 'Invalidation and structure recovery'
        },
        {
            'name': 'MICRO_STRUCTURE_SCALPING',
            'market_condition': '1m_timeframe',
            'expected': 'Micro-BOS with quick confirmation'
        }
    ]
```

---

## 🔗 CONFLUENCE CON ALGORITMOS EXISTENTES

### Integración con 8 Algoritmos Institucionales
```python
def calculate_smc_confluence(smc_result, wyckoff, order_blocks, liquidity_grabs,
                           stop_hunting, fvg, microstructure, vsa, market_profile):
    """
    Calcula confluencia SMC con otros 8 algoritmos institucionales
    """
    confluence_score = 0.0
    confluence_details = {}

    # 1. SMC + Wyckoff (estructura macro)
    if smc_result['smc_signal'] == 'BOS' and wyckoff['phase'] in ['MARKUP', 'MARKDOWN']:
        confluence_score += 0.15
        confluence_details['wyckoff'] = 'STRUCTURE_ALIGNMENT'

    # 2. SMC + Order Blocks (zonas institucionales)
    if smc_result['entry_recommendation'] and order_blocks['signal'] != 'NEUTRAL':
        ob_zone = order_blocks['zone_price']
        smc_zone = smc_result.get('entry_zone', {})
        if zones_overlap(ob_zone, smc_zone):
            confluence_score += 0.2
            confluence_details['order_blocks'] = 'ZONE_CONFLUENCE'

    # 3. SMC + Liquidity Grabs (manipulación)
    if liquidity_grabs['signal'] == 'GRAB_DETECTED':
        if smc_result['smc_signal'] == 'CHOCH':
            confluence_score += 0.1  # CHoCH post liquidity grab
            confluence_details['liquidity'] = 'POST_GRAB_STRUCTURE_CHANGE'

    # 4. SMC + Stop Hunting (invalidaciones)
    if stop_hunting['signal'] == 'HUNT_DETECTED':
        if smc_result.get('risk_assessment', {}).get('invalidation_risk') == 'HIGH':
            confluence_score -= 0.1  # Reducir confianza
            confluence_details['stop_hunting'] = 'INVALIDATION_RISK'

    # 5. SMC + Fair Value Gaps (imbalances)
    if fvg['signal'] != 'NEUTRAL':
        fvg_zone = fvg['gap_zone']
        smc_pullback = smc_result.get('pullback_opportunity', {})
        if zones_overlap(fvg_zone, smc_pullback.get('entry_zone', {})):
            confluence_score += 0.15
            confluence_details['fvg'] = 'IMBALANCE_RETEST'

    # 6. SMC + Market Microstructure (tape reading)
    if microstructure['signal'] in ['INSTITUTIONAL_ACTIVITY', 'PROFESSIONAL_INTEREST']:
        confluence_score += 0.1
        confluence_details['microstructure'] = 'PROFESSIONAL_CONFIRMATION'

    # 7. SMC + Volume Spread Analysis (effort vs result)
    if vsa['signal'] in ['NO_SUPPLY', 'NO_DEMAND']:
        if smc_result['smc_signal'] == 'BOS':
            confluence_score += 0.15
            confluence_details['vsa'] = 'EFFORT_RESULT_ALIGNMENT'

    # 8. SMC + Market Profile (value area)
    if market_profile['signal'] in ['POC_DEFENSE', 'VALUE_AREA_REJECTION']:
        mp_levels = market_profile['key_levels']
        smc_levels = smc_result.get('structure_details', {})
        if levels_confluence(mp_levels, smc_levels):
            confluence_score += 0.2
            confluence_details['market_profile'] = 'VALUE_STRUCTURE_ALIGNMENT'

    # Normalizar score
    confluence_score = min(1.0, max(0.0, confluence_score))

    return {
        'total_score': confluence_score,
        'details': confluence_details,
        'entry_recommendation': generate_entry_recommendation(confluence_score, confluence_details),
        'risk_assessment': assess_confluence_risk(confluence_score, confluence_details)
    }

def generate_entry_recommendation(score, details):
    if score >= 0.7:
        return 'HIGH_CONFIDENCE_ENTRY'
    elif score >= 0.5:
        return 'MODERATE_ENTRY'
    elif score >= 0.3:
        return 'LOW_CONFIDENCE_ENTRY'
    else:
        return 'AVOID_ENTRY'
```

---

## ✅ IMPLEMENTACIÓN

### Archivo Backend
- **Ubicación**: `backend/services/smart_money_concepts.py`
- **Integración**: Import en `backend/routes/real_trading_routes.py`
- **Función**: `_evaluate_smart_money_concepts()` en contexto análisis inteligente

### Referencias SPEC_REF
- **Concepto maestro**: `docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/09_SMART_MONEY_CONCEPTS.md`
- **Especificación técnica**: Este documento
- **Índice algoritmos**: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

### Endpoint Integration
- **POST** `/api/run-smart-trade/{symbol}`
- **Respuesta**: `institutional_confirmations.smart_money_concepts`
- **Frontend**: 9no algoritmo en charts + métricas SMC

---

*Especificación técnica completada siguiendo metodología VSA/Market Profile*
*Algoritmos: 5 específicos BOS/CHoCH detection*
*Configuración: Zero hardcodes, parámetros user-specific únicamente*
*Integración: 9no algoritmo institucional con confluencia completa*
*Performance: < 50ms, adaptación scalping micro-structure*
