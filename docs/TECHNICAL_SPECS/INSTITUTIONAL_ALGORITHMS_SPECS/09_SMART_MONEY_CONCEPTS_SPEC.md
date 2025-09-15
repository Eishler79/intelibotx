# 09_SMART_MONEY_CONCEPTS_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/09_SMART_MONEY_CONCEPTS.md

Propósito
- Leer estructura institucional (HH/LL/HL/LH), BOS y CHoCH para tendencia/pullbacks.

Entradas
- OHLCV (≥80), niveles de estructura; ATR.

Salidas
- smc_signal (BOS/CHOCH/NEUTRAL), break_level, confirmation_strength, entry_zone; details.

Reglas (resumen)
- Identificar swings significativos; confirmar BOS/CHoCH con cierres y ATR; calcular zonas de entrada a partir de estructura y OBs.

Integración
- Analizador SMC; consumo en Trend y como soporte en Scalping.

Rendimiento/Pruebas
- < 50 ms; casos de continuación y cambio de carácter, falsos breakouts.

Implementación (plan)
- Archivo: `backend/services/smart_money_concepts.py` (crear)
- Integración (referencia ALGORITMOS_SPEC):
  - Import en `backend/routes/bots.py`
  - Análisis SMC consumible por SQA y Trend Mode
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`
