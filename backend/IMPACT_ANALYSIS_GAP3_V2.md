# IMPACT ANALYSIS GAP #3 - VERSION 2 CON AJUSTES

## CAMBIOS ARQUITECTÓNICOS REQUERIDOS

### 1. DIVISIÓN DE FUNCIÓN MONOLÍTICA
**Impacto:** POSITIVO
- **Antes:** 1 función de 530 líneas (viola DL-076)
- **Después:** 4 funciones de ~130 líneas cada una
- **Beneficios:**
  - Cumple SUCCESS CRITERIA ≤150 líneas
  - Permite testing individual de cada fase
  - Mejor mantenibilidad
  - Debugging más fácil

### 2. CÁLCULO DINÁMICO DE VELAS
**Impacto:** CRÍTICO
- **Cambio requerido en:** `bots.py` línea 380
- **Antes:** `limit=100` hardcodeado
- **Después:** `limit=calculate_required_candles(bot_config.interval)`
- **Función nueva necesaria:**
```python
def calculate_required_candles(interval: str) -> int:
    candles_map = {
        '1m': 2000,  # ~33 horas
        '5m': 500,   # ~41 horas
        '15m': 200,  # ~50 horas
        '1h': 120,   # 5 días
        '4h': 90,    # 15 días
        '1d': 60     # 2 meses
    }
    return candles_map.get(interval, 100)
```

### 3. VALIDACIÓN TIMEFRAME MÍNIMO
**Impacto:** UX + CALIDAD SEÑALES
- **Nuevo diccionario requerido:**
```python
STRATEGY_MIN_TIMEFRAMES = {
    "Smart Scalper": ["5m", "15m", "30m", "1h", "4h"],
    "Trend Hunter": ["15m", "30m", "1h", "4h", "1d"]
}
```
- **Validación en:** Creación/modificación de bot
- **Mensaje usuario:** "Smart Scalper no es compatible con timeframe 1m debido a ruido excesivo"

## IMPACTOS TÉCNICOS

### PERFORMANCE
- **Antes:** 50ms con 100 velas
- **Después con 1m:** ~200ms con 2000 velas (4x más lento)
- **Después con 1h:** ~60ms con 120 velas (similar)
- **Memoria:** Hasta 20x más datos en timeframes cortos

### BACKWARDS COMPATIBILITY
- **API Response:** Sin cambios, solo más señales
- **Frontend:** No requiere cambios
- **Database:** No requiere cambios

### RIESGOS

1. **RIESGO ALTO - Binance API Rate Limits:**
   - Pedir 2000 velas puede exceder límites
   - Mitigación: Cache de datos

2. **RIESGO MEDIO - Latencia en 1m:**
   - 200ms+ puede ser lento para scalping
   - Mitigación: Procesar en background

3. **RIESGO BAJO - Usuarios confundidos:**
   - No poder usar 1m en Smart Scalper
   - Mitigación: Mensaje claro explicativo

## ARCHIVOS AFECTADOS

1. `services/signal_quality_assessor.py`:
   - Agregar 4 nuevas funciones (~420 líneas)
   - Modificar `_evaluate_wyckoff_analysis` (~20 líneas)

2. `routes/bots.py`:
   - Línea 380: Cambiar límite dinámico (~5 líneas)
   - Agregar función `calculate_required_candles` (~10 líneas)

3. `models/bot_config.py` (OPCIONAL):
   - Agregar validación timeframe en modelo (~15 líneas)

## MÉTRICAS DE ÉXITO

- [ ] 4 funciones ≤150 líneas cada una
- [ ] Velas dinámicas según timeframe
- [ ] Validación timeframe mínimo funcional
- [ ] Build time < 5s
- [ ] Response time < 300ms para cualquier timeframe
- [ ] 18 señales Wyckoff detectadas correctamente

## ESTIMACIÓN TIEMPO

- Implementación: 2 horas
- Testing: 1 hora
- Ajustes: 30 minutos
- **TOTAL: 3.5 horas**