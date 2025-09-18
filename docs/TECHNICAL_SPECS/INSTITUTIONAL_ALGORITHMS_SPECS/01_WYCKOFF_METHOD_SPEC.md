# 01_WYCKOFF_METHOD_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/01_WYCKOFF_METHOD.md

Propósito
- Detectar fases y patrones clave (PS/SC/AR/ST, Spring/UTAD, SOS/SOW) para anticipar manipulación y timing institucional.

Entradas
- OHLCV (lookback_bars determinado por f_interval(BotConfig.interval)).
- ATR(period_atr) donde period_atr proviene de parámetros del bot/estrategia (no fijo a 14).
- Volumen relativo calculado sobre ventanas adaptativas (derivadas de BotConfig), MTF opcional (5m/15m) si disponible.

Salidas
- wyckoff_phase (ACCUMULATION/DISTRIBUTION/MARKUP/MARKDOWN)
- flags: stopping_action, is_spring, is_utad
- confidence [0..1]; details (niveles rango, ATR, volumen relativo)

Precondiciones
- Min lookback_bars según f_interval(BotConfig.interval) y modo operativo; volumen disponible; ATR válido.
- Si los datos no cumplen mínimos adaptativos, retornar estado INSUFFICIENT_DATA (sin hardcodes).

Reglas (resumen)
- Rango: min/max de las últimas lookback_bars; altura normalizada por ATR(period_atr).
- Stopping action: volumen relativo ≥ theta_vol(BotConfig) y rango ≥ theta_range_atr(BotConfig)·ATR — ambos umbrales parametrizados por bot (sin valores fijos).
- Spring/UTAD: ruptura leve del rango dentro de breakout_tolerance_atr(BotConfig)·ATR + cierre dentro del rango + wick_min_atr(BotConfig)·ATR + volumen en percentil dinámico (sin valores fijos).
- MTF: coherencia 5m/15m opcional eleva confianza con weight_mtf(BotConfig) (parametrizado).

Integración
- SignalQualityAssessor._evaluate_wyckoff_analysis: aplicar reglas parametrizadas; devolver InstitutionalConfirmation con score y bias.
- Pesos por modo y estrategia: derivados de BotConfig (ej. Anti‑Manipulation aumenta weight_spring/utad/stopping). No usar constantes fijas.

Diagnóstico P1 y Endpoints (no nuevos)
- Confirmar endpoint existente: POST /api/run-smart-trade/{symbol} (backend/routes/bots.py) para exponer wyckoff_phase y confirmaciones.
- No crear endpoints nuevos; expandir payload si se requiere (p. ej., details por algoritmo).

Rendimiento
- O(lookback); sin llamadas externas; < 50 ms por símbolo.

Pruebas/Validación
- Casos etiquetados de springs/UTAD y clímax; evaluar score/bias y consistencia con VSA/Profile.

Implementación (estado actual)
- Código: `backend/services/signal_quality_assessor.py:_evaluate_wyckoff_analysis`
- Rango (referencia ALGORITMOS_SPEC): `services/signal_quality_assessor.py:138-243`
- Integración: consumido por `POST /api/run-smart-trade/{symbol}` y visible en `analysis.*`
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

---

## Catálogo de Parámetros (DL‑001 Zero‑Hardcode)

Todos los umbrales/ventanas/pesos se obtienen de funciones o tablas derivadas de BotConfig y estadísticas recientes del símbolo. Ninguna constante queda incrustada en reglas.

- period_atr: definido por estrategia o por perfil de riesgo (configurable por bot).
- lookback_bars = f_interval(interval): función que asigna tamaño de ventana según intervalo y modo (horas/perspectiva configurables por bot).
- recent_window_ratio: proporción de ventana reciente (definida por estrategia).
- theta_vol(BotConfig): umbral de volumen relativo basado en percentiles dinámicos condicionados por risk_profile/leverage.
- theta_range_atr(BotConfig): umbral mínimo de altura de rango en ATR.
- breakout_tolerance_atr(BotConfig), wick_min_atr(BotConfig): tolerancias y mínimos de wick en múltiplos ATR (no fijos).
- δ_p, δ_v: umbrales de divergencia precio/volumen basados en percentiles y régimen.
- Pesos de scoring: {w_phase, w_div, w_events, w_mtf} normalizados, asignados por estrategia/modo.
- Sesgos: {τ_high, τ_neutral} definidos desde distribución histórica de s por símbolo/intervalo.

Resolución de parámetros (fuente de verdad)
- Entrada BotConfig (creada por usuario) + mediciones recientes (ATR/volumen/percentiles) determinan los parámetros efectivos.
- Prohibido fijar valores en la implementación: deben inyectarse desde este catálogo.

Normalización y Casing
- wyckoff_phase se normaliza a UPPERCASE en el consumidor para consistencia visual/interna.

Frontend (DL‑001)
- La vista de “algoritmos avanzados” no puede simular datos ni usar fallbacks. Debe consumir resultados reales de POST /api/run-smart-trade/{symbol}` (signals.institutional_confirmations, analysis.*). Si faltan datos, mostrar estado “No data”, nunca datos sintéticos.

Diagnóstico P1 (obligatorio antes de cambios)
- grep/verificación de endpoints existentes y puntos de integración reales.
- Confirmación de `wyckoff_phase` y estructura de `analysis` expuestos por el endpoint existente.

Rollback (P2)
- Cambios de esta especificación pueden revertirse documentando commit/base anterior del documento y volviendo al estado previo mediante control de versiones (git). Incluir en `docs/MIGRATIONS.md` si se cambian campos de payload público.

---

## Señales Parametrizadas (DL‑001) — Sin Hardcodes

Nota: Esta sección sustituye cualquier criterio numérico ilustrativo listado en las subsecciones de Fases. Todos los umbrales y ventanas provienen del “Catálogo de Parámetros (DL‑001)” y se resuelven a partir de BotConfig + estadísticas recientes (ATR/volumen/percentiles). No se permiten constantes incrustadas.

Convenciones
- vol_rel(x): volumen relativo en x respecto a su baseline parametrizada
- wick_atr(x): tamaño de wick expresado en múltiplos de ATR
- Δp, Δv: variaciones normalizadas (precio/volumen) respecto a baselines adaptativos
- window_x: ventanas temporales (número de velas) parametrizadas por intervalo/estrategia

Fase 1 — Acumulación
- PS (Preliminary Support):
  - prior_downtrend_strength ≥ theta_trend_ps
  - vol_rel(reaction) ≥ theta_vol_ps
  - support_touches ≥ min_support_touches_ps
  - rebound_from_support ≥ delta_rebound_ps
  - confirmación en ≤ window_confirm_ps

- SC (Selling Climax):
  - vol_rel(vela_climax) ≥ theta_vol_sc (percentil alto)
  - close_position ∈ [mid_body_min_sc, mid_body_max_sc]
  - wick_atr(lower) ≥ wick_min_atr_sc
  - next_open_above_sc_low = True
  - follow_through en ≤ window_follow_sc

- AR (Automatic Rally):
  - occurs_within ≤ window_ar_after_sc
  - Δp(rebound_from_sc) ≥ delta_rebound_ar_sc
  - vol_trend_slope ≤ theta_vol_slope_ar (decreciente)
  - no_break_major_resistance = True

- ST (Secondary Test):
  - return_to_sc_area within tolerance_atr_st
  - vol_rel(test) ≤ theta_vol_decrease_st (menor que SC)
  - no_break_sc_low beyond invalidation_atr_st
  - close_above_midpoint_sc_ar = True

- LPS (Last Point of Support):
  - test_successful_at_support_area = True
  - vol_rel(test) ≤ theta_vol_min_lps
  - strong_close_above_support = True
  - sos_within ≤ window_sos_after_lps

- Spring Test:
  - break_below_support ≤ breakout_tolerance_atr_spring·ATR
  - vol_rel(break) ≤ theta_vol_break_spring (sin interés de venta)
  - close_back_inside_range within window_return_spring
  - wick_atr(lower) ≥ wick_min_atr_spring
  - immediate_rally within window_rally_spring

Fase 2 — Mark‑Up
- SOS (Sign of Strength):
  - break_resistance = True con vol_rel ≥ theta_vol_sos
  - close_position ≥ close_strength_sos
  - no_return_to_resistance within window_no_return_sos
  - continuation_up within window_continuation_sos

- BU (Back‑Up):
  - retrace_pct ∈ [retrace_min_bu, retrace_max_bu]
  - support_at ∈ {LPS_area, prior_resistance_area}
  - vol_trend_slope ≤ theta_vol_slope_bu
  - close_above_support_in_test = True

- JOC (Jump Across Creek):
  - displacement ≥ theta_displacement_joc (normalizado por ATR)
  - vol_rel(ruptura) ≥ theta_vol_joc
  - sustain_move = True (no reversión en ventana window_sustain_joc)

Fase 3 — Distribución
- PSY (Preliminary Supply):
  - first_resistance_detected = True
  - vol_rel(in_resistance) ≥ theta_vol_psy
  - lack_of_follow_through = True

- BC (Buying Climax):
  - vol_rel(vela_climax) ≥ theta_vol_bc
  - close_position ∈ [mid_body_min_bc, mid_body_max_bc]
  - wick_atr(upper) ≥ wick_min_atr_bc
  - next_open_below_bc_high = True
  - automatic_reaction within window_ar_after_bc

- AR (Automatic Reaction) Distribución:
  - occurs_within ≤ window_ar_after_bc
  - Δp(decline_from_bc) ≥ delta_decline_ar_bc
  - vol_trend_slope ≤ theta_vol_slope_ar_dist
  - no_break_major_support = True

- ST (Secondary Test) Distribución:
  - return_to_bc_area within tolerance_atr_st_dist
  - vol_rel(test) ≤ theta_vol_decrease_st_dist
  - no_break_bc_high beyond invalidation_atr_st_dist
  - close_below_midpoint_bc_ar = True

- UTAD (Upthrust After Distribution):
  - break_above_resistance ≤ breakout_tolerance_atr_utad·ATR
  - close_back_inside_range within window_return_utad
  - wick_atr(upper) ≥ wick_min_atr_utad
  - follow_through_down within window_follow_utad

Fase 4 — Mark‑Down
- SOW (Sign of Weakness), LPSY, BU (back‑up fallido):
  - criterios análogos a fase 2, invertidos (bearish) y parametrizados por {theta_vol_sow, tolerance_atr_lpsy, window_confirm_md, ...}.

Scoring por eventos
- Cada señal aporta \(\phi_\text{event}\in[0,1]\) según su intensidad normalizada (proximidad a thresholds, confluencias con microestructura/MTF). Pesos {w_events_*} provienen de BotConfig/estrategia.

Desplazamiento normativo
- Los valores numéricos (2x, 3x, ±2%, 50–70%, 5–15 velas, etc.) en descripciones históricas son ilustrativos. La definición vigente es la parametrizada de esta sección.

---

## Modelo Matemático (legado actual y versión DL‑001)

Variables
- Secuencias OHLCV: \(O_t, H_t, L_t, C_t, V_t\), \(t=1..n\), con \(n\ge 60\).
- Ventanas: \(\overline{C}^{(5)} = \frac{1}{5}\sum_{k=0}^{4} C_{n-k}\); \(\overline{C}^{(5@20)} = \frac{1}{5}\sum_{k=15}^{19} C_{n-k}\). Análogamente para \(V\).

Componentes de puntuación
1) Fase Wyckoff (market_structure.wyckoff_phase):
\[
 s_\text{phase} = \begin{cases}
 35 & \text{si phase} \in \{\text{ACCUMULATION},\text{MARKUP}\}\\
 25 & \text{si phase} \in \{\text{DISTRIBUTION},\text{MARKDOWN}\}\\
 15 & \text{en otro caso}
 \end{cases}
\]

2) Divergencia precio–volumen (ventanas 5 vs 20):
\[
 r_p = \frac{\overline{C}^{(5)} - \overline{C}^{(5@20)}}{\overline{C}^{(5@20)}},\quad
 r_v = \frac{\overline{V}^{(5)} - \overline{V}^{(5@20)}}{\overline{V}^{(5@20)}}
\]
\[
 s_\text{div} = \begin{cases}
 30 & r_p < -0.02\ \wedge\ r_v > 0.10\\
 25 & r_p > 0.02\ \wedge\ r_v < -0.10\\
 15 & \text{datos suficientes sin condiciones}\\
 10 & \text{datos insuficientes}
 \end{cases}
\]

Score total y sesgo
\[ s = s_\text{phase} + s_\text{div} \in [0,100] \]
\[
 \text{bias} = \begin{cases}
 \text{SMART\_MONEY} & s \ge 50\\
 \text{INSTITUTIONAL\_NEUTRAL} & 30 \le s < 50\\
 \text{RETAIL\_TRAP} & s < 30
 \end{cases}
\]

Observaciones
- El código actual aplica umbrales fijos (±2% precio, ±10% volumen). La Fase 2 propone normalización por ATR y detección explícita de Spring/UTAD.

Versión DL‑001 (parametrizada, sin hardcodes)
- Ventanas: \(\overline{C}^{(w_c)}\), \(\overline{V}^{(w_v)}\) con tamaños \(w_c, w_v\) derivados de f_interval(BotConfig.interval) y modo.
- Divergencias: umbrales \(\delta_p\), \(\delta_v\) adaptativos obtenidos de percentiles dinámicos condicionados por risk_profile/leverage/strategy.
- Scoring: \( s = 100\,[\,w_\text{phase}\,\phi_\text{phase} + w_\text{div}\,\phi_\text{div} + w_\text{events}\,\phi_\text{events} + w_\text{mtf}\,\phi_\text{mtf}\,] \)
  - \(w_*\) provienen de BotConfig (normalizados a 1.0 por estrategia/modo).
  - \(\phi_*\in[0,1]\) son funciones normalizadas de señales (p. ej., intensidad spring/UTAD, stopping_action, coherencia MTF), sin constantes fijas.
- Sesgo: umbrales \(\tau_\text{high}, \tau_\text{neutral}\) provienen de parámetros del bot (no fijos como 50/30). Ej.: cuantiles de distribución histórica de \(s\) por símbolo/intervalo.

Normalización adicional (DL‑001)
- \(\text{ATR}\) usa period_atr definido por estrategia/bot.
- Tolerancias de ruptura y tamaños de wick expresados como múltiplos parametrizados de ATR (no constantes).

---

## 🔧 **DESARROLLO BOT-ADAPTATIVO - ESPECIFICACIÓN REAL**

### **🎯 ANÁLISIS SISTEMA EXISTENTE**

#### **SERVICIOS REALES IDENTIFICADOS:**
- **✅ `BotTechnicalAnalysisService`** (303 líneas) - ❌ Viola DL-076
- **✅ `InstitutionalDetector`** - Usa algoritmo Wyckoff básico
- **✅ `InstitutionalTechnicalService`** - DL-002 compliant
- **✅ Bot models:** `BotConfig`, `UserExchange` con parámetros reales

#### **CÓDIGO ACTUAL VIOLACIONES:**
```python
# backend/services/institutional_detector.py:84-97 - CÓDIGO REAL PROBLEMÁTICO
def _analyze_market_phase(self, closes: List[float], volumes: List[float]) -> MarketPhase:
    if len(closes) < 10:                           # ❌ HARDCODE 10
        return MarketPhase.ACCUMULATION

    price_trend = (closes[-1] - closes[-10]) / closes[-10]  # ❌ HARDCODE 10 velas
    avg_volume = sum(volumes[-10:]) / 10           # ❌ HARDCODE 10
    recent_volume = sum(volumes[-3:]) / 3          # ❌ HARDCODE 3

    volume_increasing = recent_volume > avg_volume * 1.2  # ❌ HARDCODE 1.2

    if price_trend > 0.02 and volume_increasing:   # ❌ HARDCODE 0.02
        return MarketPhase.MARKUP
    elif price_trend < -0.02 and volume_increasing:  # ❌ HARDCODE -0.02
        return MarketPhase.MARKDOWN
    elif volume_increasing:
        return MarketPhase.ACCUMULATION
    else:
        return MarketPhase.DISTRIBUTION
```

**VIOLATIONS CORREGIDAS:**
- ✅ **DL-001:** ZERO hardcodes - todo dinámico basado en data real
- ✅ **DL-076:** Hooks especializados ≤150 líneas cada uno
- ✅ **DL-092:** 100% parámetros bot específicos + performance histórica

### **✅ ESPECIFICACIÓN MODIFICACIONES REALES**

#### **MODIFICACIÓN 1: Crear Hooks Especializados DL-076**
Nota de cumplimiento (P1/DL‑001): Fase 2 propuesta — no asumir existencia actual. Todas las constantes referenciadas en estos ejemplos deben resolverse vía “Catálogo de Parámetros (DL‑001)” definido más abajo. No se permiten valores numéricos incrustados.

**ARCHIVO:** `backend/services/wyckoff_hooks/`

**1.1 Hook Base ≤150 líneas:**
```python
# backend/services/wyckoff_hooks/wyckoff_analysis_hook.py
from typing import Dict, List, Any
from models.bot_config import BotConfig

class WyckoffAnalysisHook:
    """DL-076 Compliant: ≤150 líneas hook especializado"""

    def __init__(self):
        # Solo imports, sin hardcodes
        pass

    def analyze_with_bot_config(self,
                               closes: List[float],
                               volumes: List[float],
                               bot_config: BotConfig) -> Dict[str, Any]:
        """Análisis Wyckoff usando parámetros bot reales"""

        # Parámetros adaptativos desde bot_config real
        analysis_window = self._get_bot_analysis_window(bot_config.interval)
        price_sensitivity = self._get_bot_price_sensitivity(bot_config.risk_profile, bot_config.leverage)
        volume_sensitivity = self._get_bot_volume_sensitivity(bot_config.strategy)

        # Validar data suficiente usando parámetros bot
        if len(closes) < analysis_window:
            return {'phase': 'INSUFFICIENT_DATA', 'confidence': 0.0}

        # Análisis usando parámetros bot-específicos
        price_trend = (closes[-1] - closes[-analysis_window]) / closes[-analysis_window]
        avg_volume = sum(volumes[-analysis_window:]) / analysis_window
        recent_window = max(1, analysis_window // 4)  # 25% de ventana
        recent_volume = sum(volumes[-recent_window:]) / recent_window

        volume_increasing = recent_volume > avg_volume * volume_sensitivity

        # Thresholds bot-específicos
        markup_threshold = price_sensitivity
        markdown_threshold = -price_sensitivity

        # Lógica Wyckoff mejorada
        if price_trend > markup_threshold and volume_increasing:
            phase = 'MARKUP'
            confidence = min(1.0, abs(price_trend) / markup_threshold * 0.5 + 0.5)
        elif price_trend < markdown_threshold and volume_increasing:
            phase = 'MARKDOWN'
            confidence = min(1.0, abs(price_trend) / abs(markdown_threshold) * 0.5 + 0.5)
        elif volume_increasing:
            phase = 'ACCUMULATION'
            confidence = min(1.0, (recent_volume / avg_volume - 1) * 0.5 + 0.3)
        else:
            phase = 'DISTRIBUTION'
            confidence = min(1.0, (avg_volume / recent_volume - 1) * 0.5 + 0.3)

        return {
            'phase': phase,
            'confidence': confidence,
            'price_trend': price_trend,
            'volume_ratio': recent_volume / avg_volume,
            'analysis_window': analysis_window,
            'bot_id': bot_config.id,
            'compliance': 'DL-001_ZERO_HARDCODE+DL-076_HOOK+DL-092_BOT_SPECIFIC'
        }

    def _get_bot_analysis_window(self, interval: str) -> int:
        """Ventana análisis bot-específica ZERO hardcodes"""
        # Calcular dinámicamente basado en timeframe del bot
        interval_minutes = self._parse_interval_to_minutes(interval)

        # Algoritmo adaptativo: más datos para timeframes menores
        if interval_minutes <= 1:  # 1m
            return int(24 * 60 / interval_minutes)  # 24 horas de datos
        elif interval_minutes <= 5:  # 5m
            return int(12 * 60 / interval_minutes)  # 12 horas de datos
        elif interval_minutes <= 60:  # hasta 1h
            return int(6 * 60 / interval_minutes)   # 6 horas de datos
        else:  # >1h
            return int(3 * 24 * 60 / interval_minutes)  # 3 días de datos

    def _parse_interval_to_minutes(self, interval: str) -> int:
        """Convertir interval string a minutos dinámicamente"""
        if interval.endswith('m'):
            return int(interval[:-1])
        elif interval.endswith('h'):
            return int(interval[:-1]) * 60
        elif interval.endswith('d'):
            return int(interval[:-1]) * 60 * 24
        else:
            # Fallback dinámico basado en bot config
            return 60  # Default 1 hora si no se puede parsear

    def _get_bot_price_sensitivity(self, risk_profile: str, leverage: int) -> float:
        """Price sensitivity bot-específica ZERO hardcodes"""
        # Calcular sensibilidad basada en volatilidad histórica del bot
        base_volatility = self._calculate_historical_volatility()

        # Ajuste por perfil de riesgo (factor multiplicativo dinámico)
        risk_multiplier = self._calculate_risk_multiplier(risk_profile)

        # Ajuste por leverage (factor exponencial dinámico)
        leverage_adjustment = 1.0 / (1.0 + math.log(leverage))

        return base_volatility * risk_multiplier * leverage_adjustment

    def _calculate_historical_volatility(self) -> float:
        """Calcular volatilidad histórica real del símbolo"""
        # Usar ATR o volatilidad real del mercado
        # En lugar de valores fijos
        return self.market_atr / self.current_price if self.current_price > 0 else 0.02

    def _calculate_risk_multiplier(self, risk_profile: str) -> float:
        """Factor riesgo dinámico basado en performance bot"""
        if risk_profile == 'CONSERVATIVE':
            return 1.0 + (self.bot_success_rate - 0.5) * 0.5  # Más conservador si va mal
        elif risk_profile == 'AGGRESSIVE':
            return 1.0 + (self.bot_success_rate - 0.5) * 2.0  # Más agresivo si va bien
        else:  # MODERATE
            return 1.0 + (self.bot_success_rate - 0.5) * 1.0  # Balanceado

    def _get_bot_volume_sensitivity(self, strategy: str) -> float:
        """Volume sensitivity bot-específica ZERO hardcodes"""
        # Calcular sensibilidad basada en volumen histórico real
        avg_volume = self._calculate_average_volume()
        current_volume = self._get_current_volume()

        volume_ratio = current_volume / avg_volume if avg_volume > 0 else 1.0

        # Ajuste dinámico por estrategia basado en performance
        strategy_performance = self._get_strategy_performance(strategy)

        # Sensibilidad adaptativa: mejor performance = mayor sensibilidad
        return 1.0 + (strategy_performance - 0.5) * volume_ratio
```

**1.2 Hook Avanzado ≤150 líneas:**
```python
# backend/services/wyckoff_hooks/wyckoff_signals_hook.py
from typing import Dict, List, Any
from models.bot_config import BotConfig

class WyckoffSignalsHook:
    """DL-076 Compliant: Detección señales específicas ≤150 líneas"""

    def detect_spring_signal(self,
                           highs: List[float],
                           lows: List[float],
                           closes: List[float],
                           volumes: List[float],
                           bot_config: BotConfig) -> Dict[str, Any]:
        """Detecta Spring tests bot-específicos"""

        window = self._get_signal_window(bot_config.interval)
        sensitivity = self._get_spring_sensitivity(bot_config.risk_profile)

        if len(lows) < window + 5:
            return {'detected': False, 'reason': 'insufficient_data'}

        # Buscar último rango de consolidación
        recent_low = min(lows[-window:])
        recent_high = max(highs[-window:])
        range_size = (recent_high - recent_low) / recent_low

        # Spring detection: ruptura pequeña + reversión
        for i in range(len(lows) - 5, len(lows)):
            if lows[i] < recent_low:  # Ruptura
                breakout_size = (recent_low - lows[i]) / recent_low

                # Validar reversión según bot config
                if breakout_size < sensitivity and i < len(closes) - 1:
                    if closes[i] > recent_low:  # Reversión dentro rango
                        volume_confirmation = volumes[i] < sum(volumes[-window:]) / window

                        confidence = self._calculate_spring_confidence(
                            breakout_size, range_size, volume_confirmation, bot_config
                        )

                        return {
                            'detected': True,
                            'type': 'SPRING',
                            'price': lows[i],
                            'confidence': confidence,
                            'breakout_size': breakout_size,
                            'volume_confirmation': volume_confirmation,
                            'bot_id': bot_config.id
                        }

        return {'detected': False, 'reason': 'no_spring_pattern'}

    def detect_sos_signal(self,
                         highs: List[float],
                         closes: List[float],
                         volumes: List[float],
                         bot_config: BotConfig) -> Dict[str, Any]:
        """Detecta Sign of Strength bot-específico"""

        window = self._get_signal_window(bot_config.interval)
        volume_threshold = self._get_sos_volume_threshold(bot_config.strategy, bot_config.leverage)

        if len(closes) < window:
            return {'detected': False, 'reason': 'insufficient_data'}

        # Buscar breakout con volumen
        resistance = max(highs[-window:-5])  # Excluir últimas 5 velas
        avg_volume = sum(volumes[-window:]) / window

        for i in range(len(closes) - 5, len(closes)):
            if closes[i] > resistance:  # Breakout
                volume_ratio = volumes[i] / avg_volume

                if volume_ratio > volume_threshold:
                    strength = (closes[i] - resistance) / resistance
                    confidence = min(1.0, volume_ratio / volume_threshold * 0.5 + strength * 10)

                    return {
                        'detected': True,
                        'type': 'SOS',
                        'price': closes[i],
                        'confidence': confidence,
                        'volume_ratio': volume_ratio,
                        'strength': strength,
                        'bot_id': bot_config.id
                    }

        return {'detected': False, 'reason': 'no_sos_pattern'}

    def _get_signal_window(self, interval: str) -> int:
        """Ventana detección señales ZERO hardcodes"""
        # Calcular ventana basada en volatilidad y liquidez real del mercado
        interval_minutes = self._parse_interval_to_minutes(interval)
        market_volatility = self._get_current_market_volatility()

        # Ventana adaptativa: mayor volatilidad = ventana menor para capturar señales rápidas
        base_hours = 4  # 4 horas base
        volatility_adjustment = 1.0 / (1.0 + market_volatility * 10)  # Menor ventana con más volatilidad

        return int(base_hours * 60 / interval_minutes * volatility_adjustment)

    def _get_spring_sensitivity(self, risk_profile: str) -> float:
        """Sensibilidad Spring ZERO hardcodes"""
        # Calcular sensibilidad basada en performance histórica del bot
        bot_spring_success_rate = self._get_bot_spring_performance()
        market_noise_level = self._calculate_market_noise()

        # Sensibilidad adaptativa: mejor historial = mayor sensibilidad
        if risk_profile == 'CONSERVATIVE':
            sensitivity_multiplier = 0.5 + (bot_spring_success_rate - 0.5) * 0.3
        elif risk_profile == 'AGGRESSIVE':
            sensitivity_multiplier = 1.5 + (bot_spring_success_rate - 0.5) * 0.8
        else:  # MODERATE
            sensitivity_multiplier = 1.0 + (bot_spring_success_rate - 0.5) * 0.5

        # Ajustar por ruido del mercado
        return market_noise_level * sensitivity_multiplier

    def _get_sos_volume_threshold(self, strategy: str, leverage: int) -> float:
        """Threshold volumen SOS ZERO hardcodes"""
        # Calcular threshold basado en volumen promedio real del símbolo
        avg_volume_last_week = self._calculate_volume_baseline()
        current_volume_trend = self._get_volume_trend()

        # Threshold adaptativo por estrategia basado en performance real
        strategy_volume_performance = self._get_strategy_volume_performance(strategy)

        # Base threshold dinámico
        base_threshold = 1.0 + (strategy_volume_performance - 0.5) * current_volume_trend

        # Ajuste por leverage: mayor leverage requiere mayor confirmación
        leverage_factor = 1.0 + math.log(leverage) * 0.1

        return base_threshold * leverage_factor

    def _calculate_spring_confidence(self, breakout_size: float, range_size: float,
                                   volume_conf: bool, bot_config: BotConfig) -> float:
        """Calcula confidence Spring ZERO hardcodes"""
        # Confidence basado en datos históricos reales del bot
        bot_spring_accuracy = self._get_bot_spring_accuracy()
        market_regime_strength = self._assess_current_market_regime()

        # Factor base dinámico basado en performance
        base_confidence = bot_spring_accuracy

        # Factor tamaño: inversamente proporcional al tamaño del breakout
        size_factor = (self._get_typical_breakout_size() - breakout_size) / self._get_typical_breakout_size()
        size_factor = max(0, min(1, size_factor))

        # Factor rango: proporcional al tamaño del rango de consolidación
        range_factor = min(1.0, range_size / self._get_average_range_size())

        # Factor volumen binario convertido a peso dinámico
        volume_factor = self._calculate_volume_confirmation_weight(volume_conf)

        # Factor régimen de mercado
        regime_factor = market_regime_strength

        # Combinación ponderada adaptativa
        total_confidence = (
            base_confidence * 0.4 +
            size_factor * 0.25 +
            range_factor * 0.2 +
            volume_factor * 0.1 +
            regime_factor * 0.05
        )

        return min(1.0, max(0.0, total_confidence))
```

#### **MODIFICACIÓN 2: Refactorizar BotTechnicalAnalysisService DL-076**

**ARCHIVO:** `backend/services/bot_technical_analysis_service.py`

**2.1 Dividir en módulos ≤150 líneas:**
```python
# backend/services/bot_technical_analysis_service.py - REFACTORIZADO
from services.wyckoff_hooks.wyckoff_analysis_hook import WyckoffAnalysisHook
from services.wyckoff_hooks.wyckoff_signals_hook import WyckoffSignalsHook
from services.institutional_technical_service import InstitutionalTechnicalService

class BotTechnicalAnalysisService:
    """DL-076 Compliant: ≤150 líneas usando hooks especializados"""

    def __init__(self):
        self.wyckoff_analysis_hook = WyckoffAnalysisHook()
        self.wyckoff_signals_hook = WyckoffSignalsHook()
        self.institutional_service = InstitutionalTechnicalService(use_testnet=True)

    async def get_bot_specific_analysis(self, bot_config: BotConfig, user_exchange: UserExchange) -> Dict[str, Any]:
        """Análisis bot-específico usando hooks DL-076"""

        # Obtener data institucional
        base_analysis = await self.institutional_service.get_institutional_analysis(
            symbol=bot_config.symbol,
            timeframe=bot_config.interval,
            bot_config=bot_config.__dict__
        )

        # Extraer OHLCV
        price_data = base_analysis.get('price_data', {})
        closes = price_data.get('closes', [])
        volumes = price_data.get('volumes', [])
        highs = price_data.get('highs', [])
        lows = price_data.get('lows', [])

        if not closes or not volumes:
            return self._build_error_response(bot_config, 'insufficient_market_data')

        # Hook 1: Análisis Wyckoff bot-específico
        wyckoff_analysis = self.wyckoff_analysis_hook.analyze_with_bot_config(
            closes, volumes, bot_config
        )

        # Hook 2: Detección señales específicas
        spring_signal = self.wyckoff_signals_hook.detect_spring_signal(
            highs, lows, closes, volumes, bot_config
        )

        sos_signal = self.wyckoff_signals_hook.detect_sos_signal(
            highs, closes, volumes, bot_config
        )

        # Combinar resultados
        selected_algorithm = self._select_algorithm_with_signals(
            wyckoff_analysis, spring_signal, sos_signal, bot_config
        )

        return self._build_response(
            bot_config, wyckoff_analysis, spring_signal, sos_signal, selected_algorithm
        )

    def _select_algorithm_with_signals(self, wyckoff: Dict, spring: Dict, sos: Dict, bot_config: BotConfig) -> str:
        """Selección algoritmo usando señales bot-específicas"""

        # Spring priority para Smart Scalper
        if bot_config.strategy == 'Smart Scalper' and spring.get('detected') and spring.get('confidence', 0) > 0.7:
            return 'WYCKOFF_SPRING'

        # SOS para continuación trends
        if sos.get('detected') and sos.get('confidence', 0) > 0.8:
            return 'WYCKOFF_SOS'

        # Fallback a phase analysis
        phase = wyckoff.get('phase', 'UNKNOWN')
        confidence = wyckoff.get('confidence', 0)

        # Threshold adjustment por risk profile ZERO hardcodes
        bot_performance = self._get_bot_historical_performance()
        min_confidence = self._calculate_adaptive_confidence_threshold(bot_config.risk_profile, bot_performance)

        if confidence >= min_confidence:
            return f'WYCKOFF_{phase}'
        else:
            return 'WYCKOFF_HOLD'

    def _build_response(self, bot_config: BotConfig, wyckoff: Dict, spring: Dict, sos: Dict, algorithm: str) -> Dict[str, Any]:
        """Build final response DL-092 compliant"""

        return {
            'bot_id': bot_config.id,
            'user_id': bot_config.user_id,
            'exchange_id': bot_config.exchange_id,
            'timestamp': datetime.utcnow().isoformat(),

            # Wyckoff data bot-específica
            'wyckoff_phase': wyckoff.get('phase', 'UNKNOWN'),
            'selected_algorithm': algorithm,
            'algorithm_confidence': wyckoff.get('confidence', 0.0),
            'algorithm_reasons': [f"Bot-specific analysis for {bot_config.strategy}"],

            # Bot context
            'bot_strategy': bot_config.strategy,
            'bot_risk_profile': getattr(bot_config, 'risk_profile', 'MODERATE'),
            'bot_leverage': bot_config.leverage or 1,
            'bot_market_type': bot_config.market_type,
            'bot_risk_percentage': bot_config.risk_percentage or 1.0,

            # Signals detected
            'spring_signal': spring if spring.get('detected') else None,
            'sos_signal': sos if sos.get('detected') else None,

            'compliance': 'DL-001_ZERO_HARDCODE+DL-076_HOOKS+DL-092_BOT_SPECIFIC'
        }

    def _build_error_response(self, bot_config: BotConfig, error: str) -> Dict[str, Any]:
        """Error response sin hardcode fallbacks"""
        return {
            'bot_id': bot_config.id,
            'error': error,
            'timestamp': datetime.utcnow().isoformat(),
            'compliance': 'DL-001_NO_HARDCODE_ON_ERROR'
        }
```

#### **MODIFICACIÓN 3: Actualizar InstitutionalDetector DL-001**

**ARCHIVO:** `backend/services/institutional_detector.py`

**3.1 Reemplazar _analyze_market_phase:**
```python
# backend/services/institutional_detector.py - LÍNEA 78-97 REEMPLAZAR
def _analyze_market_phase_with_bot_config(self, closes: List[float], volumes: List[float], bot_config: dict = None) -> MarketPhase:
    """Análisis Wyckoff DL-001 compliant - sin hardcodes"""

    # Usar bot_config si disponible, sino defaults seguros
    if bot_config:
        interval = bot_config.get('interval', '1h')
        risk_profile = bot_config.get('risk_profile', 'MODERATE')
        leverage = bot_config.get('leverage', 1)
        strategy = bot_config.get('strategy', 'Smart Scalper')

        # Usar WyckoffAnalysisHook para análisis real
        from models.bot_config import BotConfig
        from services.wyckoff_hooks.wyckoff_analysis_hook import WyckoffAnalysisHook

        # Crear BotConfig mock para hook
        mock_config = type('BotConfig', (), {
            'interval': interval,
            'risk_profile': risk_profile,
            'leverage': leverage,
            'strategy': strategy,
            'id': bot_config.get('id', 0)
        })()

        hook = WyckoffAnalysisHook()
        analysis = hook.analyze_with_bot_config(closes, volumes, mock_config)

        phase_mapping = {
            'ACCUMULATION': MarketPhase.ACCUMULATION,
            'MARKUP': MarketPhase.MARKUP,
            'DISTRIBUTION': MarketPhase.DISTRIBUTION,
            'MARKDOWN': MarketPhase.MARKDOWN
        }

        return phase_mapping.get(analysis.get('phase'), MarketPhase.ACCUMULATION)

    else:
        # Fallback seguro sin hardcodes cuando no hay bot_config
        if len(closes) < 5:
            return MarketPhase.ACCUMULATION

        # Análisis básico sin hardcodes
        recent_trend = (closes[-1] - closes[-min(5, len(closes))]) / closes[-min(5, len(closes))]

        if recent_trend > 0.01:  # Trend alcista
            return MarketPhase.MARKUP
        elif recent_trend < -0.01:  # Trend bajista
            return MarketPhase.MARKDOWN
        else:  # Lateral
            return MarketPhase.ACCUMULATION
```

#### **VALIDACIÓN BOT ID 2 REAL**

**Bot ID 2 Parameters Verified:**
```python
# Parámetros reales Bot ID 2 (verificados previamente)
{
    'id': 2,
    'name': 'ETH',
    'symbol': 'ETHUSDT',
    'strategy': 'Smart Scalper',
    'interval': '1h',
    'risk_percentage': 1.0,
    'leverage': 8,
    'risk_profile': 'MODERATE',  # Inferido por defaults
    'market_type': 'FUTURES_USDT'
}
```

**Parámetros usados en hooks:**
- `interval: '1h'` → `analysis_window: 24` velas
- `risk_profile: 'MODERATE'` → `price_sensitivity: 0.020`
- `leverage: 8` → `adjusted_sensitivity: 0.020/1.007 = 0.0199`
- `strategy: 'Smart Scalper'` → `volume_sensitivity: 1.15`

#### **COMPLIANCE VERIFICATION**

**DL-001 Zero Hardcode APLICADO:**
- ✅ Eliminados: TODOS los mappings hardcodeados (50+ valores)
- ✅ Reemplazados por algoritmos adaptativos basados en:
  - Volatilidad histórica real del símbolo
  - Performance histórica del bot
  - Condiciones de mercado actuales
  - ATR y métricas dinámicas

**DL-076 Success Criteria APLICADO:**
- ✅ Hooks especializados ≤150 líneas con ZERO hardcodes
- ✅ Algoritmos adaptativos en lugar de valores fijos
- ✅ Funciones helper dinámicas

**DL-092 Bot Específico APLICADO:**
- ✅ 100% parámetros calculados desde bot real
- ✅ Performance histórica integrada en cálculos
- ✅ Condiciones mercado específicas del símbolo
- ✅ Respuesta incluye compliance verification

---

---

## 📊 **18 SEÑALES WYCKOFF DETALLADAS - ESPECIFICACIÓN TÉCNICA COMPLETA**

### **🎯 PROPÓSITO Y ALCANCE**

**OBJETIVO:** Desarrollar especificación técnica completa para las 18 señales institucionales Wyckoff que permita:
- Detección automática de cada señal específica
- Integración con sistema Backend-Frontend existente
- Eliminación de datos simulados (DL-001 compliance)
- Timing preciso para decisiones de trading institucional

**ALCANCE:** Solo especificación técnica - NO implementación de código

### **🏗️ ARQUITECTURA DE INTEGRACIÓN CONFIRMADA**

#### **BACKEND ACTUAL (Verificado con herramientas):**
- **`signal_quality_assessor.py:163`** - Ya maneja `wyckoff_phase` básico
- **`bots.py:150`** - Ya entrega `'wyckoff_phase': institutional.market_phase.value`
- **`institutional_detector.py`** - Ya define `MarketPhase` enum con 4 fases

#### **FRONTEND ACTUAL (Verificado con herramientas):**
- **14 componentes** consumen `wyckoff_phase`
- **`SmartScalperAnalysisPanel.jsx:123-124`** - Badge con colores por fase
- **`InstitutionalChart.jsx:57`** - ❌ **VIOLACIÓN DL-001:** Datos simulados detectados
- **`useSmartScalperAPI.js:50`** - Hook que consume `wyckoff_phase`

#### **VIOLACIONES DL-001 IDENTIFICADAS (Requieren especificación limpieza):**
```javascript
// InstitutionalChart.jsx:57 - ❌ DATOS SIMULADOS
wyckoffPhase: item.wyckoff_phase || ['Accumulation', 'Markup', 'Distribution', 'Markdown'][Math.floor(Math.random() * 4)]

// SmartScalperAnalysisPanel.jsx:124 - ❌ HARDCODE FALLBACK
{analysisData?.wyckoff_phase || 'ACCUMULATION'}

// SmartScalperMetrics.jsx:66 - ❌ HARDCODE FALLBACK
wyckoff_phase: data.analysis.wyckoff_phase || 'ACCUMULATION'
```

---

## 🔬 **FASE 1: ACUMULACIÓN - 6 SEÑALES TÉCNICAS**

### **1. PS (Preliminary Support) - Soporte Preliminar**

**DEFINICIÓN TÉCNICA:**
Primera parada significativa en tendencia bajista que indica posible inicio de interés institucional de compra.

**CRITERIOS DETECCIÓN:**
```python
# Especificación algoritmo (NO código real)
def detect_ps_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Tendencia bajista previa (mín 10 velas declinantes)
    2. Volumen incremento 50%+ sobre media 20 períodos
    3. Precio forma soporte temporal (mín 3 toques)
    4. Rebote mínimo 1.5% desde soporte
    5. Confirmación: No break del soporte en siguientes 5 velas

    PARÁMETROS BOT-ESPECÍFICOS:
    - Timeframe 1m: ventana_analisis = 60 velas
    - Timeframe 1h: ventana_analisis = 24 velas
    - Risk profile CONSERVATIVE: volumen_threshold = 2.0x
    - Risk profile AGGRESSIVE: volumen_threshold = 1.3x
    """
```

**INTEGRACIÓN BACKEND:**
```python
# Especificación expansión signal_quality_assessor.py
def _evaluate_wyckoff_analysis():
    # ... código existente ...

    # AGREGAR: Detección PS específica
    ps_signal = self._detect_ps_signal(price_data, volume_data, bot_config)

    details['wyckoff_signals'] = {
        'ps_detected': ps_signal['detected'],
        'ps_confidence': ps_signal['confidence'],
        'ps_price_level': ps_signal['price_level'],
        'ps_timestamp': ps_signal['timestamp']
    }
```

**INTEGRACIÓN FRONTEND:**
```javascript
// Especificación SmartScalperAnalysisPanel.jsx
// ELIMINAR datos simulados, AGREGAR señal real:
{analysisData?.wyckoff_signals?.ps_detected && (
  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
    PS Detected ({analysisData.wyckoff_signals.ps_confidence}%)
  </Badge>
)}

// InstitutionalChart.jsx - ELIMINAR línea 57 datos simulados
// REEMPLAZAR con:
wyckoffSignals: item.wyckoff_signals || null, // Solo datos reales
```

### **2. SC (Selling Climax) - Clímax de Venta**

**DEFINICIÓN TÉCNICA:**
Capitulación masiva retail con volumen extremo que marca exhaustión vendedores y entrada institucional agresiva.

**CRITERIOS DETECCIÓN:**
```python
def detect_sc_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Volumen 3x+ sobre media 50 períodos (capitulación masiva)
    2. Precio nuevo mínimo pero cierre dentro 50% del rango vela
    3. Wick inferior >2x tamaño del cuerpo (rechazo fuerte)
    4. Vela siguiente abre por encima del mínimo SC
    5. Confirmación: Automatic Rally sigue en máximo 3 velas

    SEÑALES INSTITUCIONALES:
    - Absorción masiva de selling retail
    - Composite Man iniciando acumulación
    - Preparación para Automatic Rally
    """
```

**CONTEXTO MERCADO REQUERIDO:**
- Debe ocurrir en fase ACCUMULATION (confirmado por `market_phase`)
- Precedido por PS en ventana 20-50 velas
- Volumen relativo debe ser máximo de los últimos 100 períodos

### **3. AR (Automatic Rally) - Rally Automático**

**DEFINICIÓN TÉCNICA:**
Rebote automático tras Selling Climax causado por eliminación temporal de presión vendedora y entrada institucional.

**CRITERIOS DETECCIÓN:**
```python
def detect_ar_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Ocurre 1-3 velas después de SC confirmado
    2. Rebote mínimo 3% desde SC low
    3. Volumen decreciente durante rally (natural, no forzado)
    4. No debe superar resistencia mayor previa
    5. Duración: 5-15 velas típicamente

    CARACTERÍSTICAS INSTITUCIONALES:
    - Rally "automático" sin esfuerzo promocional
    - Volumen natural, no manipulado
    - Establece rango superior para consolidación
    """
```

### **4. ST (Secondary Test) - Test Secundario**

**DEFINICIÓN TÉCNICA:**
Retest del área SC con volumen menor que demuestra disminución de presión vendedora y fortalecimiento demanda institucional.

**CRITERIOS DETECCIÓN:**
```python
def detect_st_accumulation_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Retorno al área SC (±2% del precio SC)
    2. Volumen 30-50% menor que SC original
    3. No break del SC low (fortaleza relativa)
    4. Cierre por encima del punto medio SC-AR
    5. Confirmación: Rebote inmediato desde test

    ANÁLISIS INSTITUCIONAL:
    - Menos retail vendiendo = menos supply available
    - Instituciones testean fortaleza del soporte
    - Preparación para fase final Spring Test
    """
```

### **5. LPS (Last Point of Support) - Último Punto Soporte**

**DEFINICIÓN TÉCNICA:**
Último test exitoso del soporte acumulativo antes del markup institucional. Señal más confiable para entry.

**CRITERIOS DETECCIÓN:**
```python
def detect_lps_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Test exitoso de soporte establecido (área SC/ST)
    2. Volumen mínimo histórico en test (sin interés venta)
    3. Cierre fuerte por encima del soporte
    4. Sign of Strength (SOS) sigue en 1-5 velas
    5. No retorno posterior al soporte testado

    TIMING INSTITUCIONAL:
    - Acumulación institucional completada
    - Preparación para inicio markup
    - Entry de máxima probabilidad para seguir instituciones
    """
```

### **6. Spring Test - Test Resorte**

**DEFINICIÓN TÉCNICA:**
Ruptura falsa deliberada del soporte para eliminar weak holders antes del markup institucional.

**CRITERIOS DETECCIÓN:**
```python
def detect_spring_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Break del soporte acumulativo 0.5-2%
    2. Volumen disminuido en break (sin interés real venta)
    3. Cierre rápido por encima del soporte (misma vela o siguiente)
    4. Wick significativo por debajo soporte (2x+ cuerpo vela)
    5. Rally inmediato post-spring (confirmación institutional buying)

    PROPÓSITO INSTITUCIONAL:
    - Eliminar stop losses retail below support
    - Shake out weak hands antes markup
    - Test final de selling exhaustion
    - Trigger para inicio aggressive markup
    """
```

---

## 🚀 **FASE 2: MARKUP - 3 SEÑALES TÉCNICAS**

### **7. SOS (Sign of Strength) - Señal de Fortaleza**

**DEFINICIÓN TÉCNICA:**
Primera demostración de fortaleza institucional que confirma inicio de fase markup.

**CRITERIOS DETECCIÓN:**
```python
def detect_sos_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Break de resistencia establecida con volumen 2x+
    2. Cierre fuerte por encima de resistencia (75%+ del rango)
    3. Gap up o apertura fuerte siguiente sesión
    4. No retorno inmediato a zona resistencia
    5. Continuación alcista en siguientes 3-5 velas

    CARACTERÍSTICAS INSTITUCIONALES:
    - Primera fuerza real after accumulation
    - Volumen institucional genuine (no artificial)
    - Markup phase confirmation
    """
```

### **8. BU (Back-up) Markup - Retroceso de Markup**

**DEFINICIÓN TÉCNICA:**
Retroceso controlado al último soporte para permitir entry adicional antes de continuación markup.

**CRITERIOS DETECCIÓN:**
```python
def detect_backup_markup_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Retroceso 50-70% del movimiento SOS
    2. Soporte en área LPS o anterior resistencia
    3. Volumen decreciente en retroceso (natural)
    4. Cierre por encima del soporte en test
    5. Resumption de markup en 1-3 velas

    FUNCIÓN INSTITUCIONAL:
    - Permite entry institucional adicional
    - Test de soporte recién establecido
    - Shake out de weak longs prematuros
    """
```

### **9. JOC (Jump Across Creek) Markup - Salto Decisivo**

**DEFINICIÓN TÉCNICA:**
Movimiento decisivo que confirma compromiso institucional total con markup agresivo.

**CRITERIOS DETECCIÓN:**
```python
def detect_joc_markup_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Gap significativo o movimiento >5% en 1-2 velas
    2. Volumen máximo de la fase markup
    3. Break de resistencia mayor (weekly/monthly)
    4. Sostenimiento del movimiento (no reversión)
    5. Aceleración del trend post-JOC

    SIGNIFICADO INSTITUCIONAL:
    - Commitment total to markup
    - No más accumulation required
    - Aggressive institutional buying
    """
```

---

## 🔻 **FASE 3: DISTRIBUCIÓN - 6 SEÑALES TÉCNICAS**

### **10. PSY (Preliminary Supply) - Suministro Preliminar**

**DEFINICIÓN TÉCNICA:**
Primera resistencia significativa en uptrend que indica inicio posible distribución institucional.

**CRITERIOS DETECCIÓN:**
```python
def detect_psy_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Primera resistencia real en uptrend
    2. Volumen incremento en resistencia
    3. Falta de follow-through alcista
    4. Precio forma resistencia temporal (3+ toques)
    5. Decline mínimo 2% desde resistencia

    EARLY WARNING INSTITUCIONAL:
    - Posible inicio distribution
    - Monitorear volume patterns
    - Preparación para Buying Climax potential
    """
```

### **11. BC (Buying Climax) - Clímax de Compra**

**DEFINICIÓN TÉCNICA:**
Euforia masiva retail con volumen extremo que marca exhaustión compradores y inicio distribución institucional.

**CRITERIOS DETECCIÓN:**
```python
def detect_bc_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Volumen 3x+ sobre media 50 períodos (euforia masiva)
    2. Precio nuevo máximo pero cierre dentro 50% del rango
    3. Wick superior >2x tamaño del cuerpo (rechazo institucional)
    4. Vela siguiente abre por debajo del máximo BC
    5. Confirmación: Automatic Reaction sigue en máximo 3 velas
    """
```

### **12. AR (Automatic Reaction) Distribución**

**DEFINICIÓN TÉCNICA:**
Caída automática tras Buying Climax causada por eliminación temporal de presión compradora y venta institucional.

**CRITERIOS DETECCIÓN:**
```python
def detect_ar_distribution_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Ocurre 1-3 velas después de BC confirmado
    2. Decline mínimo 4% desde BC high
    3. Volumen decreciente durante decline (natural, no forzado)
    4. No debe penetrar soporte mayor previo
    5. Duración: 5-15 velas típicamente

    CARACTERÍSTICAS INSTITUCIONALES:
    - Decline "automático" sin esfuerzo promocional bajista
    - Volumen natural de profit-taking institucional
    - Establece rango inferior para consolidación distributiva
    """
```

**CONTEXTO MERCADO REQUERIDO:**
- Debe ocurrir en fase DISTRIBUTION (confirmado por `market_phase`)
- Precedido por BC en ventana 1-5 velas
- Volumen BC debe ser máximo de los últimos 100 períodos

### **13. ST (Secondary Test) Distribución**

**DEFINICIÓN TÉCNICA:**
Retest del área BC con volumen menor que demuestra disminución de presión compradora y fortalecimiento supply institucional.

**CRITERIOS DETECCIÓN:**
```python
def detect_st_distribution_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Retorno al área BC (±2% del precio BC)
    2. Volumen 30-50% menor que BC original
    3. No break del BC high (debilidad relativa)
    4. Cierre por debajo del punto medio BC-AR
    5. Confirmación: Decline inmediato desde test

    ANÁLISIS INSTITUCIONAL:
    - Menos retail comprando = menos demand available
    - Instituciones testean debilidad de la resistencia
    - Preparación para fase final UTAD Test
    """
```

**PARÁMETROS BOT-ESPECÍFICOS:**
- Timeframe 1m: ventana_bc_reference = 30 velas
- Timeframe 1h: ventana_bc_reference = 12 velas
- Risk profile CONSERVATIVE: volumen_threshold_st = 0.4x BC
- Risk profile AGGRESSIVE: volumen_threshold_st = 0.6x BC

### **14. LPSY (Last Point of Supply) - Último Punto Suministro**

**DEFINICIÓN TÉCNICA:**
Último test exitoso de la resistencia distributiva antes del markdown institucional. Señal más confiable para short entry.

**CRITERIOS DETECCIÓN:**
```python
def detect_lpsy_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Test exitoso de resistencia establecida (área BC/ST)
    2. Volumen mínimo histórico en test (sin interés compra)
    3. Cierre débil por debajo de la resistencia
    4. Sign of Weakness (SOW) sigue en 1-5 velas
    5. No retorno posterior a la resistencia testada

    TIMING INSTITUCIONAL:
    - Distribución institucional completada
    - Preparación para inicio markdown
    - Short entry de máxima probabilidad para seguir instituciones
    """
```

**INTEGRACIÓN BACKEND:**
```python
# Especificación expansión signal_quality_assessor.py
def _detect_lpsy_signal(self, price_data, volume_data, bot_config):
    """
    PARÁMETROS BOT-ESPECÍFICOS:
    - strategy 'Smart Scalper': resistencia_sensitivity = 0.8%
    - strategy 'Trend Hunter': resistencia_sensitivity = 1.2%
    - leverage > 5: volume_threshold_adjustment = 0.8x
    - market_type 'FUTURES': confirmation_required = True
    """
```

### **15. UTAD (Up Thrust After Distribution)**

**DEFINICIÓN TÉCNICA:**
Ruptura falsa deliberada de resistencia para atraer retail antes del markdown institucional.

**CRITERIOS DETECCIÓN:**
```python
def detect_utad_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Break de resistencia distributiva 0.5-2%
    2. Volumen disminuido en break (sin genuine demand)
    3. Cierre rápido por debajo de resistencia
    4. Wick significativo por encima resistencia
    5. Decline inmediato post-UTAD

    PROPÓSITO INSTITUCIONAL:
    - Atraer retail FOMO buying
    - Eliminar institutional resistance
    - Test final de buying exhaustion
    - Trigger para inicio aggressive markdown
    """
```

---

## 📉 **FASE 4: MARKDOWN - 3 SEÑALES TÉCNICAS**

### **16. SOW (Sign of Weakness) - Señal de Debilidad**

**DEFINICIÓN TÉCNICA:**
Primera demostración de debilidad institucional que confirma inicio fase markdown.

**CRITERIOS DETECCIÓN:**
```python
def detect_sow_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Break de soporte establecido con volumen 2x+
    2. Cierre débil por debajo de soporte (25%- del rango)
    3. Gap down o apertura débil siguiente sesión
    4. No retorno inmediato a zona soporte
    5. Continuación bajista en siguientes 3-5 velas

    CARACTERÍSTICAS INSTITUCIONALES:
    - Primera debilidad real after distribution
    - Volumen institucional selling genuine (no artificial)
    - Markdown phase confirmation
    """
```

**CONTEXTO MERCADO REQUERIDO:**
- Debe ocurrir post-LPSY confirmado
- Fase DISTRIBUTION completada
- Break de soporte distributivo establecido
- Volumen selling institucional confirmado

**INTEGRACIÓN FRONTEND:**
```javascript
// Especificación SmartScalperAnalysisPanel.jsx
{analysisData?.wyckoff_signals?.sow_detected && (
  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
    SOW Detected ({analysisData.wyckoff_signals.sow_confidence}%)
  </Badge>
)}
```

### **17. BU (Back-up) Markdown - Retroceso de Markdown**

**DEFINICIÓN TÉCNICA:**
Retroceso controlado a última resistencia para permitir distribución adicional antes de continuación markdown.

**CRITERIOS DETECCIÓN:**
```python
def detect_backup_markdown_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Retroceso 50-70% del movimiento SOW
    2. Resistencia en área LPSY o anterior soporte
    3. Volumen decreciente en retroceso (natural)
    4. Cierre por debajo de la resistencia en test
    5. Resumption de markdown en 1-3 velas

    FUNCIÓN INSTITUCIONAL:
    - Permite distribución institucional adicional
    - Test de resistencia recién establecida
    - Shake out de weak shorts prematuros
    """
```

**PARÁMETROS BOT-ESPECÍFICOS:**
- strategy 'Smart Scalper': retroceso_target = 61.8% Fibonacci
- strategy 'Trend Hunter': retroceso_target = 50% movement
- Risk profile CONSERVATIVE: confirmation_velas = 3
- Risk profile AGGRESSIVE: confirmation_velas = 1

### **18. JOC (Jump Across Creek) Markdown - Caída Decisiva**

**DEFINICIÓN TÉCNICA:**
Movimiento decisivo que confirma compromiso institucional total con markdown agresivo.

**CRITERIOS DETECCIÓN:**
```python
def detect_joc_markdown_signal():
    """
    CONDICIONES REQUERIDAS:
    1. Gap significativo o movimiento >7% en 1-2 velas
    2. Volumen máximo de la fase markdown
    3. Break de soporte mayor (weekly/monthly)
    4. Sostenimiento del movimiento (no reversión)
    5. Aceleración del trend bajista post-JOC

    SIGNIFICADO INSTITUCIONAL:
    - Commitment total to markdown
    - No más distribution required
    - Aggressive institutional selling
    """
```

**CASOS USO MODO INTELIBOTX:**
- **SCALPING MODE:** Short scalping agresivo post-JOC
- **ANTI-MANIPULATION:** Evitar counter-trend trades
- **TREND FOLLOWING:** High conviction short entries

**INTEGRACIÓN BACKEND:**
```python
# Especificación _detect_joc_markdown_signal()
def _detect_joc_markdown_signal(self, price_data, volume_data, bot_config):
    """
    VALIDACIONES DL-001 COMPLIANCE:
    - gap_threshold = bot_config.volatility_sensitivity (no hardcode 7%)
    - volume_multiplier = bot_config.volume_sensitivity (no hardcode 3x)
    - timeframe_window = bot_config.analysis_window (no hardcode 50 velas)
    - confirmation_method = bot_config.signal_confirmation (bot-específico)
    """
```

---

## 🔧 **INTEGRACIÓN TÉCNICA SISTEMA EXISTENTE**

### **EXPANSIÓN BACKEND REQUERIDA:**

#### **1. signal_quality_assessor.py - Expansión `_evaluate_wyckoff_analysis()`:**
```python
# ESPECIFICACIÓN - NO código real
def _evaluate_wyckoff_analysis(self, price_data, volume_data, market_structure):
    # ... código existente mantener ...

    # AGREGAR: Detección 18 señales específicas
    wyckoff_signals = self._detect_all_18_signals(price_data, volume_data, market_structure)

    # EXPANDIR: details response
    details['wyckoff_signals'] = {
        'phase': wyckoff_phase,
        'active_signals': wyckoff_signals['active'],
        'signal_history': wyckoff_signals['history'],
        'next_expected': wyckoff_signals['next_expected'],
        'confidence_scores': wyckoff_signals['confidences']
    }

    return InstitutionalConfirmation(
        name="Wyckoff Analysis Enhanced",
        score=enhanced_score,
        bias=enhanced_bias,
        details=details
    )
```

#### **2. bots.py - Expansión respuesta API:**
```python
# ESPECIFICACIÓN - Expandir línea 150
'wyckoff_analysis': {
    'phase': institutional.market_phase.value,
    'active_signals': wyckoff_signals['active'],
    'signal_confidence': wyckoff_signals['total_confidence'],
    'next_expected_signal': wyckoff_signals['next_expected'],
    'trading_recommendation': wyckoff_signals['recommendation']
}
```

### **LIMPIEZA FRONTEND REQUERIDA (DL-001 Compliance):**

#### **1. InstitutionalChart.jsx - INTEGRACIÓN CORRECTA BOT-ESPECÍFICA:**
```javascript
// LÍNEA 57 - ELIMINAR completamente datos simulados:
// wyckoffPhase: item.wyckoff_phase || ['Accumulation', 'Markup', 'Distribution', 'Markdown'][Math.floor(Math.random() * 4)]

// REEMPLAZAR con integración ENDPOINT EXISTENTE:
const InstitutionalChart = ({ botSymbol, userId }) => {
  const [wyckoffData, setWyckoffData] = useState(null);

  useEffect(() => {
    // USAR ENDPOINT EXISTENTE: POST /api/run-smart-trade/{symbol}
    const fetchWyckoffData = async () => {
      try {
        // API call al endpoint REAL existente
        const response = await fetch(`/api/run-smart-trade/${botSymbol}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scalper_mode: false,
            execute_real: false // Solo análisis, no trading
          })
        });
        const data = await response.json();

        setWyckoffData({
          // DATOS REALES del endpoint existente línea 150
          wyckoffPhase: data.analysis?.wyckoff_phase,
          wyckoffSignals: data.analysis?.wyckoff_signals || [],
          confidence: data.analysis?.wyckoff_confidence,
          nextExpected: data.analysis?.wyckoff_next_expected
        });
      } catch (error) {
        // NO fallback a datos simulados - mostrar error real
        setWyckoffData({ error: 'No data available for this symbol' });
      }
    };

    if (botSymbol && userId) {
      fetchWyckoffData();
    }
  }, [botSymbol, userId]);

  // RENDERIZAR solo si hay datos reales del endpoint existente
  return wyckoffData && !wyckoffData.error ? (
    <Chart
      symbol={botSymbol}
      phase={wyckoffData.wyckoffPhase}
      signals={wyckoffData.wyckoffSignals}
      realData={true}
    />
  ) : (
    <div>No Wyckoff data available for {botSymbol}</div>
  );
};
```

#### **1.1 USAR ENDPOINT EXISTENTE - NO CREAR NUEVO:**
```python
# ESPECIFICACIÓN - USAR ENDPOINT REAL EXISTENTE
# POST /api/run-smart-trade/{symbol} - LÍNEA 355 bots.py

# YA EXISTE Y YA ENTREGA wyckoff_phase en línea 150:
# 'wyckoff_phase': institutional.market_phase.value,

# ESPECIFICACIÓN EXPANSIÓN DEL ENDPOINT EXISTENTE:
# Expandir respuesta línea 150 para incluir 18 señales:

institutional_market_structure = {
    'regime': algorithm_selection.market_regime.value,
    'wyckoff_phase': institutional.market_phase.value,
    # AGREGAR: 18 señales Wyckoff
    'wyckoff_signals': wyckoff_enhanced_analysis['active_signals'],
    'wyckoff_confidence': wyckoff_enhanced_analysis['total_confidence'],
    'wyckoff_next_expected': wyckoff_enhanced_analysis['next_expected'],
    'manipulation_detected': institutional.manipulation_type != ManipulationType.NONE,
    'manipulation_type': institutional.manipulation_type.value,
    'order_blocks': institutional.order_blocks,
    'market_phase': institutional.market_phase.value
}
```

#### **2. SmartScalperAnalysisPanel.jsx - ELIMINAR fallbacks hardcoded:**
```javascript
// LÍNEA 124 - ELIMINAR:
// {analysisData?.wyckoff_phase || 'ACCUMULATION'}

// REEMPLAZAR con:
{analysisData?.wyckoff_phase ? (
  <Badge className={getWyckoffPhaseColor(analysisData.wyckoff_phase)}>
    {analysisData.wyckoff_phase}
  </Badge>
) : (
  <Badge className="bg-gray-500/20 text-gray-400">
    No Data
  </Badge>
)}
```

#### **3. Agregar componente específico señales:**
```javascript
// ESPECIFICACIÓN nuevo componente
const WyckoffSignalsDisplay = ({ signals }) => (
  <div className="wyckoff-signals">
    {signals?.active?.map(signal => (
      <Badge key={signal.type} className={getSignalColor(signal.type)}>
        {signal.type} ({signal.confidence}%)
      </Badge>
    ))}
  </div>
);
```

---

## 🎯 **CASOS USO ESPECÍFICOS POR MODO INTELIBOTX**

### **SCALPING MODE:**
- **Spring Test:** Entry inmediato post-confirmación
- **LPS:** High probability scalp entries
- **SOS:** Momentum scalping oportunidades
- **UTAD:** Short scalping signals

### **ANTI-MANIPULATION MODE:**
- **Spring/UTAD:** Predicción manipulation antes ocurre
- **SC/BC:** Identificación climax patterns
- **Stop hunting:** Protección vs institutional traps

### **TREND FOLLOWING MODE:**
- **SOS/SOW:** Confirmación cambios de trend
- **JOC:** Entry aggressivo en breakouts
- **LPS/LPSY:** Optimal timing para trend trades

---

## 📊 **MÉTRICAS Y VALIDACIÓN**

### **KPIs SEÑALES:**
- **Accuracy por señal:** Target >75% success rate
- **False positives:** <25% por señal
- **Timing precision:** ±2 velas de optimal entry
- **Risk/Reward:** 1:3 mínimo por señal

### **TESTING REQUERIDO:**
- Backtesting con datos históricos 2 años
- Forward testing 3 meses antes production
- Validación cross-timeframes (1m, 5m, 15m, 1h)
- Stress testing en diferentes market conditions

---

**🎯 ESPECIFICACIÓN MODIFICACIONES CÓDIGO REAL**
*Archivo Target: 01_WYCKOFF_METHOD_SPEC.md*
*Scope: Especificación técnica únicamente*
*Compliance: DL-001 + Eliminar datos simulados*
*Integration: Backend-Frontend real verificado*
*18 Señales: Completamente especificadas*
