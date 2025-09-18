# 03_LIQUIDITY_GRABS_SPEC.md — Especificación Técnica REAL

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/03_LIQUIDITY_GRABS.md
- Implementación REAL: backend/services/signal_quality_assessor.py:362-488
- Endpoint REAL: backend/routes/bots.py POST /api/run-smart-trade/{symbol}
- Frontend API REAL: frontend/src/features/dashboard/hooks/useSmartScalperAPI.js
- SPEC_REF maestro: docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md
 - FE (DL‑001) Cleanup: La vista avanzada no debe simular datos (sin Math.random ni fallbacks). Consumir solo `POST /api/run-smart-trade/{symbol}`; si falta info, mostrar “No data”.

---

## 🔍 **DIAGNÓSTICO SITUACIÓN ACTUAL (P1)**

### **FLUJO REAL VERIFICADO:**
```
✅ ENDPOINT REAL EXISTENTE:
- POST /api/run-smart-trade/{symbol}
- backend/routes/bots.py → signal_quality_assessor.py:362-488
- Retorna analysis.institutional_confirmations.liquidity_grabs
- MISMO ENDPOINT usado en Wyckoff y Order Blocks

✅ FRONTEND INTEGRATION REAL:
- useSmartScalperAPI.js:97 → POST /api/run-smart-trade/${botSymbol}
- Data mapping: liquidity_grabs: data.analysis.liquidity_grabs ? 1 : 0

❌ VIOLACIÓN DL-001 CRÍTICA - DATOS FALSOS FRONTEND:
- InstitutionalChart.jsx:55 → Math.random() > 0.8 (genera datos falsos)
- Chart NO usa datos reales del endpoint /api/run-smart-trade
- DESCONEXIÓN: Analysis disponible pero chart usa datos simulados
```

---

## ❌ **VIOLACIONES DL-001 IDENTIFICADAS**

### **CRITICAL: DATOS FALSOS EN FRONTEND**
```javascript
// InstitutionalChart.jsx:55 - VIOLACIÓN DL-001 CRÍTICA
liquidityGrabs: item.liquidity_grabs || (Math.random() > 0.8 ? Math.random() * 200 + item.price : null),

// InstitutionalChart.jsx:84 - VIOLACIÓN DL-001 EN SAMPLE DATA
liquidityGrabs: Math.random() > 0.8 ? price + (Math.random() - 0.5) * 200 : null,
```

### **HARDCODES EN BACKEND:**
```python
# signal_quality_assessor.py:390-419 - 26 HARDCODES DETECTADOS
1.001, 0.999    # Break thresholds
1.3, 1.2        # Volume multipliers
0.995, 1.005    # Rejection thresholds
10, 5           # Window sizes
25, 15, 8       # Scoring weights
3, 1            # Score thresholds
```

---

## 🎯 **IMPLEMENTACIÓN REAL ACTUAL**

### **ALGORITMO BACKEND (CÓDIGO REAL):**
```python
# backend/services/signal_quality_assessor.py:362-488 (legado)
# Comentario de especificación: Umbrales hardcodeados a sustituir por parámetros del Catálogo DL‑001
```

### **SALIDA REAL ACTUAL:**
```python
# ESTRUCTURA REAL QUE RETORNA EL BACKEND:
InstitutionalConfirmation(
    name="Liquidity Grabs",
    score=min(score, 100),
    bias="SMART_MONEY" | "INSTITUTIONAL_NEUTRAL",
    details={
        'liquidity_grabs_analysis': {
            'total_buy_side_grabs': buy_side_grabs,      # Conteo real
            'total_sell_side_grabs': sell_side_grabs,    # Conteo real
            'recent_buy_grabs': recent_buy_grabs,        # Últimas 10 velas
            'recent_sell_grabs': recent_sell_grabs,      # Últimas 10 velas
            'grab_direction': grab_direction,            # BEARISH/BULLISH/MIXED
            'direction_implication': direction_implication,
            'institutional_activity_level': "HIGH"|"MEDIUM"|"LOW"
        }
    }
)
```

---

## 📚 **CATÁLOGO DE PARÁMETROS (DL‑001 Zero‑Hardcode)**

Todos los umbrales/ventanas/pesos se resuelven dinámicamente a partir de BotConfig del usuario y estadísticas recientes del símbolo (ATR, volumen relativo, percentiles por régimen). Ninguna constante queda incrustada en las reglas.

- lookback_high_window, lookback_low_window = f_interval_windows(BotConfig.interval)
- recent_activity_window = f_recent_window(BotConfig.interval)
- breakout_tolerance = f_breakout_tolerance(BotConfig.risk_profile, BotConfig.leverage, atr_pct)
- rejection_tolerance = f_rejection_tolerance(BotConfig.market_type, atr_pct)
- volume_boost_threshold = f_volume_threshold(BotConfig.strategy, volume_percentiles)
- vol_sma_fn = adaptive_sma(volumes, i, window=f_sma_window(BotConfig.interval))
- scoring_weights = f_scoring_weights(BotConfig.strategy)
- detect_threshold = f_detect_threshold(BotConfig.strategy)

Normalizaciones
- Profundidad en ATR: depth_up_atr, depth_dn_atr
- Reversión en ATR: reverse_delta_atr
- Volumen relativo: vol_ratio vs baseline adaptativa (SMA/percentil)

## 📐 Señales Parametrizadas (DL‑001) — Sin Hardcodes

- Buy‑side grab (arriba):
  - Break de `local_high` con tolerancia `breakout_tolerance·ATR`
  - Volumen ≥ `volume_boost_threshold` (percentil dinámico)
  - Rechazo: `close ≤ high - rejection_tolerance·ATR`

- Sell‑side grab (abajo):
  - Break de `local_low` con tolerancia `breakout_tolerance·ATR`
  - Volumen ≥ `volume_boost_threshold`
  - Rechazo: `close ≥ low + rejection_tolerance·ATR`

- Actividad reciente: contar eventos en `recent_activity_window` (parametrizado por intervalo)

- Scoring: `s = w_depth·depth_atr + w_reversal·reverse_strength + w_volume·vol_ratio + w_recent·recent_count_norm` (pesos desde estrategia)

- Sesgos: `τ_high/τ_medium` dinámicos por cuantiles históricos del score por símbolo/intervalo

## 🔧 **CORRECCIONES ESPECIFICADAS APLICANDO LECCIONES WYCKOFF**

### **1. BACKEND: HOOKS ESPECIALIZADOS DL-076 (≤150 líneas)**
Nota P1/DL‑001: Hook propuesto (Fase 2). No asumir existencia actual. Todos los umbrales provienen del Catálogo de Parámetros; no se permiten valores fijos.

**ARCHIVO:** `backend/services/liquidity_hooks/liquidity_grabs_hook.py`

```python
# ESPECIFICACIÓN - NO código real
class LiquidityGrabsHook:
    """DL-076 Compliant: ≤150 líneas hook especializado"""

    def analyze_with_bot_config(self,
                               price_data: pd.DataFrame,
                               volume_data: List[float],
                               bot_config: BotConfig) -> Dict[str, Any]:
        """Análisis Liquidity Grabs usando parámetros bot reales"""

        # Parámetros adaptativos desde bot_config real
        analysis_window = self._get_bot_analysis_window(bot_config.interval)
        break_sensitivity = self._get_bot_break_sensitivity(bot_config.risk_profile, bot_config.leverage)
        volume_sensitivity = self._get_bot_volume_sensitivity(bot_config.strategy)
        rejection_sensitivity = self._get_bot_rejection_sensitivity(bot_config.market_type)

        # Extraer arrays desde bot-specific window
        highs = price_data['high'].tail(analysis_window).values
        lows = price_data['low'].tail(analysis_window).values
        closes = price_data['close'].tail(analysis_window).values
        volumes = volume_data[-analysis_window:]

        if len(highs) < analysis_window:
            return {'detected': False, 'reason': 'insufficient_data'}

        buy_side_grabs, sell_side_grabs = self._detect_grabs_bot_specific(
            highs, lows, closes, volumes,
            break_sensitivity, volume_sensitivity, rejection_sensitivity
        )

        # Análisis direccional bot-específico
        grab_direction = self._analyze_direction_with_bot_context(
            buy_side_grabs, sell_side_grabs, bot_config
        )

        return {
            'total_buy_side_grabs': buy_side_grabs,
            'total_sell_side_grabs': sell_side_grabs,
            'grab_direction': grab_direction,
            'analysis_window': analysis_window,
            'bot_id': bot_config.id,
            'compliance': 'DL-001_ZERO_HARDCODE+DL-076_HOOK+DL-092_BOT_SPECIFIC'
        }

    def _get_bot_analysis_window(self, interval: str) -> int:
        """Ventana análisis bot‑específica (parametrizada)"""
        return f_interval(interval)

    def _get_bot_break_sensitivity(self, risk_profile: str, leverage: int) -> float:
        """Break sensitivity bot‑específica (parametrizada)"""
        return f_breakout_tolerance(risk_profile, leverage, current_atr_pct())

    def _get_bot_volume_sensitivity(self, strategy: str) -> float:
        """Volume sensitivity bot‑específica (parametrizada)"""
        return f_volume_threshold(strategy, current_volume_percentiles())

    def _get_bot_rejection_sensitivity(self, market_type: str) -> float:
        """Rejection sensitivity bot‑específica (parametrizada)"""
        return f_rejection_tolerance(market_type, current_atr_pct())
```

### **2. FRONTEND: INTEGRACIÓN COMPLETA CON ENDPOINT EXISTENTE**

**ARCHIVO:** `frontend/src/components/InstitutionalChart.jsx`

```javascript
// ESPECIFICACIÓN - ELIMINAR LÍNEAS 55 y 84 completamente
// REEMPLAZAR con integración ENDPOINT EXISTENTE:

const InstitutionalChart = ({
  symbol = "BTCUSDT",
  interval = "15m",
  theme = "dark",
  botId,     // AGREGAR: Bot ID real
  userId     // AGREGAR: User ID real
}) => {
  const [institutionalData, setInstitutionalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstitutionalData = async () => {
      if (!botId || !userId) return;

      try {
        // USAR ENDPOINT EXISTENTE: POST /api/run-smart-trade/{symbol}
        const response = await fetch(`/api/run-smart-trade/${symbol}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('intelibotx_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scalper_mode: false,
            execute_real: false // Solo análisis, no trading
          })
        });

        const data = await response.json();

        setInstitutionalData({
          // DATOS REALES del endpoint existente
          liquidityGrabs: data.analysis?.institutional_confirmations?.liquidity_grabs?.details?.liquidity_grabs_analysis || null,
          orderBlocks: data.analysis?.institutional_confirmations?.order_blocks || null,
          wyckoffPhase: data.analysis?.wyckoff_phase || null,
          // NO fallbacks random - solo datos reales
        });

      } catch (error) {
        // NO fallback a datos simulados - mostrar error real
        setInstitutionalData({ error: 'No institutional data available' });
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutionalData();
  }, [symbol, botId, userId]);

  // RENDERIZAR solo si hay datos reales del endpoint existente
  const transformedData = useMemo(() => {
    if (!institutionalData || institutionalData.error) return [];

    return data.map((item, index) => ({
      time: new Date(item.timestamp || Date.now() - (data.length - index) * 900000).toLocaleTimeString(),
      price: parseFloat(item.price || item.close),
      volume: parseFloat(item.volume),
      // USAR SOLO DATOS REALES - NO Math.random()
      liquidityGrabs: institutionalData.liquidityGrabs?.total_buy_side_grabs > 0 ?
        item.price * (1 + institutionalData.liquidityGrabs.grab_direction_factor) : null,
      orderBlocks: institutionalData.orderBlocks?.detected ? item.price : null,
      wyckoffPhase: institutionalData.wyckoffPhase
    }));
  }, [data, institutionalData]);

  if (loading) {
    return <div>Loading real institutional data...</div>;
  }

  if (institutionalData?.error) {
    return <div>No institutional analysis available for {symbol}</div>;
  }

  // ... resto del componente usando transformedData SIN Math.random()
};
```

### **3. API: USAR ENDPOINT EXISTENTE - NO CREAR NUEVO**

**ARCHIVO:** `backend/routes/bots.py`

```python
# ESPECIFICACIÓN - EXPANDIR ENDPOINT EXISTENTE línea 355
# POST /api/run-smart-trade/{symbol} - YA EXISTE

# MODIFICAR línea 150 para incluir estructura completa:
institutional_market_structure = {
    'regime': algorithm_selection.market_regime.value,
    'wyckoff_phase': institutional.market_phase.value,

    # EXPANDIR: Incluir análisis completo liquidity grabs (parametrizado)
    'institutional_confirmations': {
        'liquidity_grabs': {
            'detected': liquidity_confirmation.score > detect_threshold,
            'details': liquidity_confirmation.details,
            'confidence': liquidity_confirmation.score,
            'bias': liquidity_confirmation.bias
        }
    },

    'manipulation_detected': institutional.manipulation_type != ManipulationType.NONE,
    'manipulation_type': institutional.manipulation_type.value,
    'order_blocks': institutional.order_blocks,
    'market_phase': institutional.market_phase.value
}
```

---

## 🏛️ **INTEGRACIÓN BOT-ESPECÍFICA REAL**

### **PARÁMETROS BOT QUE INFLUYEN ALGORITMO:**

```python
# ESPECIFICACIÓN - Mapeo BotConfig → Liquidity Grabs Parameters (DL‑001, sin hardcodes)
from types import SimpleNamespace

def get_liquidity_params_from_real_bot(bot_config: BotConfig, recent_stats: dict):
    """Mapear configuración bot real a parámetros liquidity grabs (parametrizado)"""

    # Ventanas por intervalo (funciones configurables)
    analysis_window = f_interval(bot_config.interval, mode=bot_config.strategy)
    lookback_high_window = f_lookback_high(bot_config.interval)
    lookback_low_window = f_lookback_low(bot_config.interval)
    recent_activity_window = f_recent_window(bot_config.interval)

    # ATR y percentiles de volumen recientes
    atr_pct = recent_stats.get('atr_pct')
    volume_percentiles = recent_stats.get('volume_percentiles')  # p70/p85/etc.

    # Tolerancias/umbrales parametrizados
    breakout_tolerance = f_breakout_tolerance(bot_config.risk_profile, bot_config.leverage, atr_pct)
    rejection_tolerance = f_rejection_tolerance(bot_config.market_type, atr_pct)
    volume_boost_threshold = f_volume_threshold(bot_config.strategy, volume_percentiles)

    # Pesos/umbral de detección por estrategia
    scoring = f_scoring_weights(bot_config.strategy)
    detect_threshold = f_detect_threshold(bot_config.strategy)

    # SMA de volumen adaptativa
    vol_sma_fn = lambda vol, i: adaptive_sma(vol, i, window=f_sma_window(bot_config.interval))

    return SimpleNamespace(
        analysis_window=analysis_window,
        lookback_high_window=lookback_high_window,
        lookback_low_window=lookback_low_window,
        recent_activity_window=recent_activity_window,
        breakout_tolerance=breakout_tolerance,
        rejection_tolerance=rejection_tolerance,
        volume_boost_threshold=volume_boost_threshold,
        scoring=scoring,
        detect_threshold=detect_threshold,
        vol_sma_fn=vol_sma_fn
    )
```

---

## 📊 **CASOS PRUEBA ESPECIFICADOS**

### **1. DATOS REALES BOT ID 2:**
```python
def test_liquidity_grabs_with_real_bot_2():
    """Test con Bot ID 2 real - ETHUSDT Smart Scalper"""

    # Bot real verificado
    bot_config = BotConfig(
        id=2,
        symbol='ETHUSDT',
        strategy='Smart Scalper',
        interval='1h',
        leverage=8,
        risk_profile='MODERATE',
        market_type='FUTURES_USDT'
    )

    # Parámetros calculados (no hardcodes):
    expected_params = {
        'analysis_window': 24,  # 1h interval
        'break_sensitivity': 0.001 / 1.0007 = 0.0009993,  # Adjusted for leverage 8
        'volume_sensitivity': 1.15,  # Smart Scalper
        'rejection_sensitivity': 0.005  # FUTURES_USDT
    }

    # Datos reales de mercado (NO simulados)
    real_price_data = get_real_market_data('ETHUSDT')
    real_volume_data = get_real_volume_data('ETHUSDT')

    # Evaluación con parámetros bot-específicos
    result = evaluate_liquidity_grabs(real_price_data, real_volume_data, bot_config)

    # Validaciones DL-001 compliance
    assert result['total_buy_side_grabs'] >= 0
    assert result['total_sell_side_grabs'] >= 0
    assert result['grab_direction'] in ['BEARISH_LIQUIDITY_GRAB', 'BULLISH_LIQUIDITY_GRAB', 'MIXED_LIQUIDITY_ACTIVITY']
    assert result['bot_id'] == 2
```

### **2. FRONTEND SIN DATOS FALSOS:**
```javascript
function test_frontend_no_fake_data() {
    // Test: Frontend NO debe generar datos aleatorios
    const realBotData = null;  // Sin datos del bot

    const result = transformInstitutionalData(realBotData);

    // DEBE mostrar null, NO datos random
    expect(result.liquidityGrabs).toBe(null);
    expect(result.liquidityGrabs).not.toContain('Math.random');

    // NO debe haber fallbacks a datos simulados
    expect(result.toString()).not.toContain('Math.random');
}
```

---

## ⚡ **COMPLIANCE VALIDATION**

### **DL-001 COMPLIANCE:**
- ✅ Eliminar Math.random() de InstitutionalChart.jsx:55,84
- ✅ Usar solo datos reales del endpoint POST /api/run-smart-trade
- ✅ Extraer todos los hardcodes a parámetros bot-específicos
- ✅ ZERO fallbacks hardcodeados

### **DL-008 COMPLIANCE:**
- ✅ Usar endpoint existente con authentication
- ✅ NO crear nuevas APIs sin justificación

### **DL-076 COMPLIANCE:**
- ✅ Hook LiquidityGrabsHook ≤150 líneas
- ✅ Componentes frontend ≤150 líneas
- ✅ Hooks especializados para API calls

---

## 🎯 **ESTADO FINAL ESPECIFICADO**

### **PROBLEMAS CORREGIDOS:**
1. **26 hardcodes** → Reemplazados por parámetros bot-específicos reales
2. **Math.random() violations** → Eliminados, usar solo datos reales endpoint
3. **Desconexión chart-analysis** → Conectar InstitutionalChart con POST /api/run-smart-trade

### **INTEGRACIÓN REAL:**
- ✅ **USAR:** POST /api/run-smart-trade/{symbol} (existente)
- ❌ **NO CREAR:** Nuevas APIs
- ✅ **CONECTAR:** InstitutionalChart con datos reales del endpoint existente
- ❌ **ELIMINAR:** Math.random() fallbacks en frontend

---

**🎯 LIQUIDITY GRABS: ESPECIFICACIÓN TÉCNICA APLICANDO LECCIONES WYCKOFF**
*✅ Flujo real usando endpoint existente POST /api/run-smart-trade*
*✅ ZERO hardcodes - todo desde bot_config real*
*✅ ZERO Math.random() - solo datos reales*
*✅ Hooks DL-076 especializados ≤150 líneas*
*Status: 📋 SPEC CORREGIDA - Aplicando lecciones Wyckoff correctamente*
