# 10_INSTITUTIONAL_ORDER_FLOW_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/10_INSTITUTIONAL_ORDER_FLOW.md

Propósito
- Detectar señales de order flow institucional (icebergs, bloques, imbalances) con L2 preferente; usar proxies robustos cuando no haya L2.

Entradas
- L2/Depth WS (ideal) o proxies OHLCV/microestructura; volumen; ATR.

Salidas
- orderflow_signals (accumulation/distribution/imbalance), direction, hidden_size/strength; confidence; details.

Reglas (resumen)
- Icebergs/bloques: patrones de absorción/ejecución característicos; imbalances persistentes bid/ask; defensa de niveles.

Integración
- Módulo de order flow; pesos altos en Anti‑Manipulation y soporte en Trend/Volatility.

Rendimiento/Pruebas
- Bajo coste cuando proxies; con L2, procesamiento eficiente; validar en eventos de defensa de valor.

Implementación (plan)
- Archivo sugerido: `backend/services/order_flow_analyzer.py` (o `institutional_order_flow_analyzer.py`)
- Integración inicial con proxies (microestructura + patrones OHLCV) si L2 no disponible.
- Consumo: Anti‑Manipulation Mode (consenso Composite+OrderFlow) y como filtro en Trend/Volatility.
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`
