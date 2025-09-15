# MODE_SELECTION_CONCEPT.md - Selección Inteligente de Modos

> Objetivo: Definir el marco conceptual para activar el modo óptimo (Scalping, Trend, Anti‑Manipulation, News, Volatility) según régimen de mercado y señales institucionales.

---

## 🧭 Principios
- Detectores transversales (12 algoritmos) → Modos como políticas (pesos/umbrales/acciones).
- Gating por régimen: manipulación, tendencia, noticias, volatilidad, normal.
- Histeresis/estabilidad: evitar “flapping” (umbral de cambio y tiempo mínimo).
- Transparencia: razones/score y modo seleccionado con confianza.

---

## 🔎 Conjunto de Features (conceptual)
- Volatilidad: ATR%, intraday range, clustering.
- Manipulación: stop hunts, liquidity grabs, Composite Man, order‑flow proxy.
- Noticias: eventos, surprise score, options flow.
- Tendencia: SMC (BOS/CHoCH), POC migration, VSA esfuerzo/resultado.
- Microestructura: POC/VAH/VAL, va_occupancy, order‑flow imbalance proxy.

---

## 🎚️ Scoring por Modo (conceptual)
- Anti‑Manipulation: Composite Man (0.30), Order Flow (0.25), StopHunt (0.20), Liquidity (0.15), VSA (0.10).
- Trend Following: SMC (0.35), Market Profile (0.25), VSA (0.20), OB (0.10), Microestructura (0.10).
- News Sentiment: Central Bank (0.50), Options Flow (0.30), Volatilidad (0.20).
- Volatility Adaptive: VSA Volatility (0.40), Market Profile Adaptive (0.30), Microestructura (0.20), Flash patterns (0.10).
- Smart Scalper (default): OB (0.20), FVG (0.15), Liquidity (0.20), StopHunt (0.20), Wyckoff (0.15), Microestructura (0.10).

Nota: pesos ilustrativos; se ajustan con validación.

---

## ✅ Selección & Histeresis
- Seleccionar modo con mayor score > umbral.
- Exigir margen sobre el segundo mejor (p. ej., 10%) o mantener modo si diferencia < margen (estabilidad).
- Tiempo mínimo en modo (p. ej., 5–10 min) salvo emergencia (manipulation_emergency).

---

## 🛡️ Acciones por Modo
- Anti‑Manipulation: FADE/FLAT, tamaño reducido, stops ceñidos, TP rápido.
- Trend Following: FOLLOW, tamaño normal‑alto, trailing progresivo.
- News Sentiment: ventanas temporales, stops amplios + trailing rápido.
- Volatility Adaptive: time‑boxing, posición adaptable, TP/SL dinámica.
- Smart Scalper: micro‑targets, consenso 3/6, trailing corto.

---

## 📊 Métricas & Feedback
- Win rate, PF, TTP, DD por modo; drift de features; ajuste de pesos.

