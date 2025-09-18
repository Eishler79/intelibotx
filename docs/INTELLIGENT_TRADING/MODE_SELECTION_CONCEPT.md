# MODE_SELECTION_CONCEPT.md - Selección Inteligente de Modos (DL‑001)

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

## 🎚️ Scoring por Modo (DL‑001)
- Los pesos por modo son 100% configurables vía ModeParamProvider (estrategia/perfil del bot). No usar literales en la lógica.
- Ejemplo de distribución inicial (ilustrativa, no normativa):
  - Anti‑Manipulation: Composite Man, Order Flow, StopHunt, Liquidity, VSA.
  - Trend Following (Trend Hunter): SMC, Market Profile, VSA, OB, Microestructura.
  - News Sentiment: Central Bank, Options Flow, Volatilidad.
  - Volatility Adaptive: VSA Volatility, Market Profile Adaptive, Microestructura, Flash patterns.
  - Smart Scalper (default): OB, FVG, Liquidity, StopHunt, Wyckoff, Microestructura.

---

## ✅ Selección & Histeresis (DL‑001)
- Seleccionar modo con mayor score > `mode_params.selection_threshold`.
- Exigir margen sobre el segundo mejor `mode_params.margin_lead` o mantener modo si diferencia < margen (estabilidad).
- Tiempo mínimo en modo `mode_params.min_mode_duration` salvo emergencia (`mode_params.emergency_override`).

---

## 🛡️ Acciones por Modo (parametrizadas)
- Anti‑Manipulation: FADE/FLAT, tamaño reducido, stops ceñidos, TP rápido.
- Trend Following (Trend Hunter): FOLLOW, tamaño normal‑alto, trailing progresivo.
- News Sentiment: ventanas temporales, stops amplios + trailing rápido.
- Volatility Adaptive: time‑boxing, posición adaptable, TP/SL dinámica.
- Smart Scalper: micro‑targets, consenso N/6 configurable, trailing corto.

---

## 🔌 ModeParamProvider (fuente de verdad)

Define parámetros por modo/estrategia, derivados de `BotConfig` (risk_profile, TP/SL, leverage, cooldown, interval) + `recent_stats` + `symbol_meta`.

Interfaz sugerida (referencia):
```python
class ModeParamProvider(Protocol):
    def get_mode_weights(self, strategy: str) -> Dict[str, float]: ...  # pesos por algoritmo
    def get_selection_params(self, strategy: str) -> Dict[str, Any]: ...  # umbral, margen, min_duration, emergency flags
    def get_timeframes(self, strategy: str) -> Dict[str, Any]: ...        # analysis/entry/exit/confirmation
    def get_risk_params(self, strategy: str) -> Dict[str, Any]: ...       # base_risk, target/stop ranges, max daily
    def get_consensus_params(self, strategy: str) -> Dict[str, Any]: ...  # min_signal_conf, min_strong_signals, weights
```

Implementaciones distintas para Smart Scalper (rápido, micro‑targets) y Trend Hunter (tendencial, targets amplios).

---

## 📊 Métricas & Feedback
- Win rate, PF, TTP, DD por modo; drift de features; ajuste de pesos.
