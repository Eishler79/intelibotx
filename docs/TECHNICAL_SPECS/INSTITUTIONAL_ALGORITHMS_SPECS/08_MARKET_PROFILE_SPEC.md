# 08_MARKET_PROFILE_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/08_MARKET_PROFILE.md

Propósito
- Construir distribución volumen‑a‑precio, POC/VA, shape y niveles operativos para confluencias/entradas/salidas.

Entradas
- OHLCV (≥100); tick/precision; ventana configurable.

Salidas
- poc, vah, val, profile_type, acceptance_level; details (zonas institucionales).

Reglas (resumen)
- VA = 70% alrededor del POC; shape P/b/D/balanced; aceptación por % cierres en VA; defensa niveles por volumen relativo.

Integración
- Servicio dedicado; expuesto a SQA y a UI para transparencia.

Rendimiento/Pruebas
- < 40 ms; estabilidad de niveles; verificación con escenarios de migración POC.

Implementación (plan)
- Archivo: `backend/services/market_profile_analyzer.py` (crear)
- Integración (referencia ALGORITMOS_SPEC):
  - Import en `backend/routes/bots.py`
  - Cálculo previo y suministro a SQA y a UI (transparencia)
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`
