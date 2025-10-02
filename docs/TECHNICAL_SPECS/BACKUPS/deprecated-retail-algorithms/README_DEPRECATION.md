# DEPRECATED RETAIL ALGORITHMS BACKUP

## 🚨 VIOLACIÓN DL-002 DETECTADA Y RESUELTA

### **PROBLEMA IDENTIFICADO:**
- `smart_scalper_algorithms.py` contenía 8 algoritmos retail (RSI, MACD, EMA, Bollinger)
- **VIOLACIÓN DIRECTA** de DL-002: "SOLO algoritmos institucionales Smart Money (NO retail RSI/MACD/EMA)"
- Contradicción fundamental con filosofía core bot único institucional

### **ALGORITMOS RETAIL DEPRECADOS:**
1. `ema_crossover_algorithm` ❌ RETAIL
2. `rsi_oversold_algorithm` ❌ RETAIL
3. `macd_divergence_algorithm` ❌ RETAIL
4. `support_bounce_algorithm` ❌ RETAIL
5. `moving_average_alignment` ❌ RETAIL
6. `higher_high_formation` ❌ RETAIL
7. `volume_breakout_algorithm` ❌ RETAIL
8. `bollinger_squeeze_algorithm` ❌ RETAIL

### **ANÁLISIS DE USO:**
- ✅ **SISTEMA INSTITUCIONAL:** NO usa este componente (routes/bots.py usa servicios institucionales)
- ⚠️ **SISTEMA WEBSOCKET:** SÍ usa este componente (binance_websocket_service.py)

### **ACCIÓN TOMADA:**
- **FECHA:** 2025-09-22
- **ARCHIVO MOVIDO:** `smart_scalper_algorithms.py` → `smart_scalper_algorithms_deprecated_YYYYMMDD_HHMMSS.py`
- **MOTIVO:** Compliance DL-002 + filosofía institucional

### **PRÓXIMOS PASOS:**
1. Actualizar `binance_websocket_service.py` para usar servicios institucionales
2. Eliminar imports de `SmartScalperEngine` en WebSocket
3. Completar migración a algoritmos institucionales únicamente

### **DECISIONES RELACIONADAS:**
- **DL-002:** SOLO algoritmos institucionales Smart Money
- **CORE_PHILOSOPHY:** Bot único institucional anti-manipulación
- **GUARDRAILS:** P1-P9 metodología compliance

---
*Deprecación ejecutada por Claude Code - Compliance DL-002*