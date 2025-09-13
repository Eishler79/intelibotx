# OPTIMIZATION_MODE_INTELL.md — Plan Operativo (Claude-Executable) bajo Filosofía Core

> PROPÓSITO: Alinear “Smart Scalper” y cimientos del Bot Único a la Filosofía Core (anti‑manipulación, institucional-only, adaptación) con pasos ejecutables por Claude, respetando GUARDRAILS y DL‑001/DL‑002/DL‑008.

---

## 🧭 Premisas y Alcance

- Filosofía Core: Bot Único adaptativo, protección anti‑manipulación, ganancias rápidas 0.5–1.5%, SOLO algoritmos institucionales.
- Guardrails: P1–P9 obligatorios; confirmar conmigo cambios estructurales y en archivos críticos.
- DL‑001: Sin hardcode/simulación; datos y APIs reales.
- DL‑002: “Institutional‑only” (prohibido RSI/MACD/EMA/Bollinger como señales decisoras).
- DL‑008: Autenticación centralizada `get_current_user_safe()` en todas las rutas protegidas.

Alcance inmediato (P0–P6):
- P0: Config toggles + limpieza menor segura.
- P1: Pipeline real‑time institucional (unificar y eliminar señales retail en WS).
- P2: Implementar VSA (algoritmo #7) como confirmación institucional.
- P3: Implementar Market Profile Analyzer dedicado y su integración.
- P4: Alinear la regla de “consenso 3/6 ≥ 0.7” explícita en backend y exponer al frontend.
- P5: Selector de Modo mínimo (heurístico) compatible con futuro ML.
- P6: Asesor de Ejecución mínimo (slippage/agresividad) + métricas.

Entregables secundarios (P7–P9):
- P7: Limpieza retail remanente + coherencia de logs/telemetría.
- P8: Validación/Testing + métricas éxito.
- P9: Documentación + SPEC_REF + rollback.

---

## 📌 Estado Base Validado (Contexto)

- Smart Scalper institucional vía HTTP: OK. Ruta `POST /api/run-smart-trade/{symbol}` integra selección de algoritmo + microestructura + institucional + MTF + filtro de calidad institucional (6/12) y expone métricas a UI.
- WebSocket/RT: Contaminación retail (RSI/EMA/MACD/Bollinger) en `binance_websocket_service.py` y `smart_scalper_algorithms.py` (contradice DL‑002).
- Algoritmos: 6/12 implementados en `services/signal_quality_assessor.py`. Pendientes: VSA, Market Profile dedicado, SMC, Order Flow, A/D, Composite Man.
- Specs MODE/EXECUTION/ML: Conceptuales; falta implementación productiva.

---

## 🌐 Alineación Infra (Railway/Vercel) y Despliegue sin ML

Viabilidad técnica (sin ML pesado):
- Backend Railway: viable para P0–P6 en un único proceso web con throttling 10–15s por símbolo y ventana OHLCV≈100.
- Frontend Vercel: SPA consumiendo `VITE_API_BASE_URL` apuntando a Railway.
- PostgreSQL Railway: estable; P0–P6 no requieren cambios de esquema por defecto.

Variables de entorno relevantes (PRD):
- Backend: `ENCRYPTION_MASTER_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`, `USE_TESTNET`, `INSTITUTIONAL_RT_ONLY=true`, (opcional) `REDIS_URL`.
- Frontend: `VITE_API_BASE_URL=https://<railway-app>.railway.app`.

Notas:
- Compartir cómputo por símbolo (no por usuario) en WS institucional y cachear 10–15s.
- Si `REDIS_URL` presente, usar cache/pubsub; fallback a memoria si no.

---

## 🗄️ Estrategia de Base de Datos (PostgreSQL)

- P0–P6: sin migraciones necesarias. Si se persisten nuevas métricas (p.ej., `execution_advice`, `consensus_3of6`, KPIs WS), crear tablas ligeras y registrar en `docs/MIGRATIONS.md`.
- Pooling: tamaño moderado; evitar un pool por usuario/símbolo.
- Índices: sólo si hay consultas frecuentes sobre nuevas métricas.

---

## 🔐 Seguridad y Secretos (CRÍTICO)

- No almacenar credenciales en repo. Toda clave en variables de entorno (Railway/Vercel). Rotar claves expuestas en documentación previa.
- Asegurar consistencia de `ENCRYPTION_MASTER_KEY` entre entornos si migras datos.
- Validar CORS y dominios frontend en PRD.

---

## 🤖 Ruta ML (Futuro) y On-Prem (Dell PowerEdge R820)

- ML pesado (entrenamiento/inferencia): fuera del proceso web de Railway. Microservicio aparte (HTTP/cola Redis) con contrato: features in → predicciones out.
- Dell PowerEdge R820: recomendado para backtesting/entrenamiento e inferencia dedicada. Integración mediante `REDIS_URL` (streams/cola) o API privada. No bloquea P0–P6.

---

## 🚦 P0 — Toggles + Limpieza Segura

Objetivo: Preparar ejecución segura y reversible.

- Agregar flag env `INSTITUTIONAL_RT_ONLY=true` (default true) para WS institucional.
- Limpiar imports no usados retail donde sea trivial (sin cambiar lógica).

Archivos:
- `backend/services/advanced_algorithm_selector.py` → eliminar imports no usados `calculate_rsi/ema/sma/atr`.
- `.env`/Railway → `INSTITUTIONAL_RT_ONLY=true` (documentar, no code‑change si ya existe config runtime) y (opcional) `REDIS_URL`.

Rollback: Revertir diffs; flag env no destructivo.

SPEC_REF:
- `// SPEC_REF: docs/TECHNICAL_SPECS/OPTIMIZATION_MODE_INTELL.md#p0`

---

## 🧩 P1 — Pipeline Real‑Time Institucional (WS unificado)

Objetivo: Reemplazar señales retail de WS por agregación institucional ligera y coherente con HTTP.

Cambios clave:
- Crear `backend/services/institutional_realtime_service.py` que compute cada T segundos:
  - `InstitutionalDetector` (manipulación/phase/order blocks).
  - `MarketMicrostructureAnalyzer` (POC/VAH/VAL/imbalance).
  - `SignalQualityAssessor` (6/12; luego 7/12 con VSA).
  - Output compacto: `{ symbol, institutional_quality.overall_score, confidence_level, smart_money_recommendation, confirmations_count, wyckoff_phase, poc, vah, val }`.
- `backend/services/binance_websocket_service.py`:
  - Cuando `INSTITUTIONAL_RT_ONLY=true`, suprimir cálculo/emit de RSI/EMA/MACD/Bollinger y publicar frame institucional de `institutional_realtime_service`.
  - Mantener compatibilidad del stream, pero con campos `institutional_*` y sin exponer indicadores retail.
- `backend/services/realtime_data_manager.py`:
  - Actualizar logs: eliminar log basado en RSI; incluir `institutional_quality` y `smart_money_recommendation`.
  - Compartir cálculo por símbolo (cache 10–15s) entre usuarios; si `REDIS_URL`, usar cache cross‑process; si no, memoria local.

Skeleton (ejemplo):
```python
# services/institutional_realtime_service.py
from services.institutional_detector import InstitutionalDetector
from services.market_microstructure_analyzer import MarketMicrostructureAnalyzer
from services.signal_quality_assessor import SignalQualityAssessor

class InstitutionalRealtimeService:
    def __init__(self):
        self.detector = InstitutionalDetector()
        self.mma = MarketMicrostructureAnalyzer()
        self.sqa = SignalQualityAssessor()

    def compute_institutional_frame(self, symbol: str, ohlcv: dict) -> dict:
        # ohlcv = { 'opens':[], 'highs':[], 'lows':[], 'closes':[], 'volumes':[] }
        institutional = self.detector.analyze_institutional_activity(
            symbol=symbol, timeframe="1m",
            opens=ohlcv['opens'], highs=ohlcv['highs'], lows=ohlcv['lows'],
            closes=ohlcv['closes'], volumes=ohlcv['volumes']
        )
        micro = self.mma.analyze_market_microstructure(
            symbol=symbol, timeframe="1m",
            highs=ohlcv['highs'], lows=ohlcv['lows'],
            closes=ohlcv['closes'], volumes=ohlcv['volumes']
        )
        import pandas as pd
        price_data = pd.DataFrame({
            'open': ohlcv['opens'], 'high': ohlcv['highs'],
            'low': ohlcv['lows'], 'close': ohlcv['closes']
        })
        quality = self.sqa.assess_signal_quality(
            price_data=price_data,
            volume_data=ohlcv['volumes'],
            indicators={}, market_structure={'wyckoff_phase': institutional.market_phase.name},
            timeframe='1m'
        )
        return {
            'symbol': symbol,
            'institutional_quality_score': quality.overall_score,
            'institutional_confidence': quality.confidence_level,
            'smart_money_recommendation': quality.smart_money_recommendation,
            'confirmations_count': len(quality.institutional_confirmations or {}),
            'wyckoff_phase': institutional.market_phase.value,
            'poc': micro.point_of_control,
            'vah': micro.value_area_high,
            'val': micro.value_area_low
        }
```

Aceptación:
- WS no emite indicadores retail; emite frame institucional cada 10–15s.
- Logs `RealtimeDataManager` no mencionan RSI/EMA; sí recom. Smart Money.
- UI “Indicadores Avanzados” sigue funcional (usa HTTP); si se integra WS, mostrará mismos campos.
 - En PRD, consumo CPU estable y número de conexiones WS dentro de límites del plan Railway.

Rollback: Conmutar flag `INSTITUTIONAL_RT_ONLY=false` y revertir cambios WS.

SPEC_REF:
- `// SPEC_REF: docs/TECHNICAL_SPECS/OPTIMIZATION_MODE_INTELL.md#p1`

---

## 📊 P2 — Volume Spread Analysis (VSA) como 7/12

Objetivo: Implementar VSA (Tom Williams) y sumarlo a confirmaciones del `SignalQualityAssessor`.

Cambios:
- Crear `backend/services/volume_spread_analyzer.py` (según `ALGORITMOS_SPEC.md`).
- Integrar en `SignalQualityAssessor` como confirmación `vsa`: cálculo con OHLCV, clasificaciones (NO_SUPPLY/NO_DEMAND/CLIMAX/...); mapear a `InstitutionalConfirmation` con score/bias.
- Ajustar pesos: p.ej. `vsa: 0.15` y recalibrar umbrales si aplica.

Skeleton:
```python
from dataclasses import dataclass
from enum import Enum
import numpy as np

class VolumeSpreadType(Enum):
    NO_DEMAND = 'no_demand'
    NO_SUPPLY = 'no_supply'
    CLIMAX = 'climax'
    PROFESSIONAL = 'professional'
    RETAIL = 'retail'

@dataclass
class VSAResult:
    vs_type: VolumeSpreadType
    strength_score: float  # 0-100

class VolumeSpreadAnalyzer:
    def analyze(self, opens, highs, lows, closes, volumes) -> VSAResult:
        # Implementación resumida (ver ALGORITMOS_SPEC)
        # ... calcular ratings por volumen/spread/close_position ...
        return VSAResult(vs_type=VolumeSpreadType.PROFESSIONAL, strength_score=75)
```

Aceptación:
- `SignalQualityAssessor` expone `institutional_confirmations.vsa` con score/bias coherente.
- `run-smart-trade` incluye el nuevo campo en `signals.institutional_confirmations` (no rompe UI).

Rollback: No se tocan modelos DB; remover import/llamada VSA.

SPEC_REF:
- `// SPEC_REF: docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md#vsa`
- `// SPEC_REF: docs/TECHNICAL_SPECS/OPTIMIZATION_MODE_INTELL.md#p2`

---

## 🗺️ P3 — Market Profile Analyzer dedicado

Objetivo: Separar Market Profile (POC/VAH/VAL/profile shape) en servicio dedicado e integrarlo en SQA y salida de API.

Cambios:
- Crear `backend/services/market_profile_analyzer.py` (según spec). No reemplaza microestructura, la complementa.
- `SignalQualityAssessor`: nueva confirmación `market_profile` (score por aceptación, distancia a POC, shape coherente con tendencia, etc.). Peso sugerido `0.15`.
- `run-smart-trade` → exponer en `analysis` los campos POC/VAH/VAL del analyzer dedicado (mantener los actuales por compatibilidad).

Aceptación:
- Cálculo consistente en distintos símbolos; tiempos < 50ms para 100 velas.
- UI muestra POC/VAH/VAL sin regresión.

Rollback: Mantener `MarketMicrostructureAnalyzer` como fuente actual si falla el dedicado.

SPEC_REF:
- `// SPEC_REF: docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md#market-profile`
- `// SPEC_REF: docs/TECHNICAL_SPECS/OPTIMIZATION_MODE_INTELL.md#p3`

---

## ✅ P4 — Consenso explícito “3/6 ≥ 0.7” (y reporte)

Objetivo: Alinear regla documentada con implementación y exponerla.

Cambios:
- `SignalQualityAssessor._calculate_institutional_quality`:
  - Agregar conteo `high_confidence_count` = confirmaciones con `score_normalizado ≥ 70`.
  - Añadir boolean `meets_consensus_3of6` = `high_confidence_count ≥ 3`.
  - Incluir ambos en retorno (y en `get_institutional_summary`).
- `run-smart-trade` → incluir `analysis.institutional_high_conf_count` y `analysis.consensus_3of6`.

Aceptación:
- Endpoint refleja el conteo y boolean; UI puede mostrar badge “3/6 OK”.

Rollback: Solo campos nuevos; no se quitan existentes.

SPEC_REF:
- `// SPEC_REF: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/SCALPING_MODE.md#multi-algoritmo`
- `// SPEC_REF: docs/TECHNICAL_SPECS/OPTIMIZATION_MODE_INTELL.md#p4`

---

## 🧠 P5 — Selector de Modo Mínimo (heurístico)

Objetivo: Preparar la interfaz del “Mode Selection AI” con heurística ligera, compatible con ML futuro.

Cambios:
- Crear `backend/services/mode_selector.py` con función:
```python
def select_mode_heuristic(features: dict) -> tuple[str, float, dict]:
    """Devuelve (mode, confidence, reasons) usando:
    - manipulation_risk, atr_pct, upcoming_news_score, trend_strength, volatility_regime"""
```
- `run-smart-trade` → calcular features rápidos (ATR%, manip_risk de InstitutionalDetector, dummy news_score=0 por ahora) y añadir `analysis.selected_mode`, `analysis.mode_confidence` (sin cambiar decisiones de scalper, solo reporte al inicio).

Aceptación:
- Reporta `SCALPING` por defecto; si `manipulation_risk>0.75` → `ANTI_MANIPULATION`; si `atr_pct>5%` → `VOLATILITY_ADAPTIVE`; si `trend_strength>0.8` → `TREND_FOLLOWING`.

Rollback: Campo de reporte; no cambia lógica de trading todavía.

SPEC_REF:
- `// SPEC_REF: docs/TECHNICAL_SPECS/MODE_SELECTION_SPEC.md#mode-selection-logic`
- `// SPEC_REF: docs/TECHNICAL_SPECS/OPTIMIZATION_MODE_INTELL.md#p5`

---

## ⚙️ P6 — Asesor de Ejecución mínimo + métricas

Objetivo: Sin DMA/FPGA, aportar asesoría básica de ejecución (agresividad/fragmentación) y registrar métricas.

Cambios:
- Crear `backend/services/execution_advisor.py`:
```python
class ExecutionAdvisor:
    def advise(self, atr_pct: float, liquidity_depth: float, urgency: str='NORMAL') -> dict:
        # Devuelve { aggression: 'LOW/MEDIUM/HIGH', fragmentation: int, slippage_expectation_bps: float }
```
- `run-smart-trade` → incluir `analysis.execution_advice` (no ejecuta órdenes reales, solo recomendación).
- `execution_metrics` servicio: ampliar para registrar `suggested_aggression` y `slippage_expectation_bps` cuando se ejecute real en testnet.

Aceptación:
- Advice presente y consistente; no rompe flujos existentes.

Rollback: Remover campos nuevos; sin impacto de base.

SPEC_REF:
- `// SPEC_REF: docs/TECHNICAL_SPECS/EXECUTION_ENGINE_SPEC.md#adaptive-execution`
- `// SPEC_REF: docs/TECHNICAL_SPECS/OPTIMIZATION_MODE_INTELL.md#p6`

---

## 🧹 P7 — Limpieza Retail y Coherencia Logs

Objetivo: Quitar referencias retail donde no aportan valor o cambian decisiones.

- `services/smart_scalper_algorithms.py`: depreciar para no producir señales; mantener utilidades si alguna vista legacy lo requiere, marcando `@deprecated`.
- `binance_websocket_service.py` y `realtime_data_manager.py`: eliminar logs RSI/EMA; usar únicamente campos institucionales.

SPEC_REF:
- `// SPEC_REF: docs/GOVERNANCE/GUARDRAILS.md#dl-002`
- `// SPEC_REF: docs/TECHNICAL_SPECS/OPTIMIZATION_MODE_INTELL.md#p7`

---

## ✅ P8 — Validación, Métricas y Testing

Aceptación por tarea:
- P1: WS emite frame institucional; sin indicadores retail; latencia < 200 ms/frame; SmartScalperMetrics sin regresión.
- P2–P3: `run-smart-trade` responde en < 1.2s; campos VSA y Market Profile presentes; coherentes con OHLCV.
- P4: `consensus_3of6=true` cuando ≥3 confirmaciones ≥70.
- P5: `analysis.selected_mode` consistente con heurística;
- P6: `execution_advice` presente con campos `aggression/fragmentation/slippage_bps`.

Pruebas (manuales/controladas):
- Endpoint: `POST /api/run-smart-trade/BTCUSDT?scalper_mode=true&execute_real=false` (token válido).
- WS: suscripción `BTCUSDT@kline_1m`; verificar payload institucional (inspección logs y callbacks de `RealtimeDataManager`).
- UI: Abrir “Ver Indicadores Avanzados” y confirmar mapeo.

KPIs éxito:
- Build OK y latencias HTTP/WS dentro de objetivos.
- Cero referencias retail en payloads/telemetría pública.
- Incremento `overall_score` estable; sin regresiones de UX.
 - Railway: uso CPU/memoria y conexiones WS bajo límites del plan.

SPEC_REF:
- `// SPEC_REF: docs/GOVERNANCE/GUARDRAILS.md#p3`
- `// SPEC_REF: docs/SESSION_CONTROL/MASTER_PLAN.md#master-plan`

---

## 🧯 P9 — Documentación, SPEC_REF y Rollback

Documentar:
- `CLAUDE_INDEX.md`: añadir referencias a nuevos servicios (VSA/MarketProfile/ModeSelector/ExecutionAdvisor).
- `DECISION_LOG.md`: entradas DL‑00X para cada P1–P6 con impacto y rollback.
- `MIGRATIONS.md`: N/A (sin cambios de esquema).
 - `DEPLOYMENT_GUIDE.md`: añadir `INSTITUTIONAL_RT_ONLY` y (opcional) `REDIS_URL`; marcar que las claves en docs previas son placeholders y deben rotarse.

Rollback general:
- Mantener commits atómicos por P‑tarea + backups de archivos alterados en `docs/TECHNICAL_SPECS/BACKUPS/`.
- Flags: `INSTITUTIONAL_RT_ONLY` desactiva P1 sin revertir código si se requiere mitigación inmediata.

---

## 📅 Timeline sugerido

- Semana 1: P0–P2 (toggles + WS institucional + VSA)  
- Semana 2: P3–P4 (Market Profile dedicado + consenso explícito)
- Semana 3: P5–P6 (Mode selector mínimo + Execution advisor)
- Semana 4: P7–P9 (Cleanup, validación, documentación)

---

## ⚠️ Riesgos y Mitigación

- Carga CPU por cómputo institucional en WS → throttling 10–15s e incremental calc.
- Divergencia HTTP vs WS → usar misma librería/servicios (`SignalQualityAssessor`, `MarketMicrostructureAnalyzer`).
- UX depende hoy de HTTP → WS como mejora incremental; no romper polling existente.
 - Secrets expuestos → rotación inmediata y borrado de valores sensibles en docs públicas; sólo usar env vars.

---

## 📦 Matriz de Entornos y Vars

Backend (Railway):
- `DATABASE_URL`: PostgreSQL Railway
- `ENCRYPTION_MASTER_KEY`: clave consistente entre entornos
- `JWT_SECRET_KEY`: secreto JWT
- `USE_TESTNET`: `true|false`
- `INSTITUTIONAL_RT_ONLY`: `true` (default PRD)
- `REDIS_URL` (opcional): Redis gestionado para cache/pubsub WS

Frontend (Vercel):
- `VITE_API_BASE_URL`: URL Railway

---

---

## ✅ Definición de Done (P0–P6)

- WS “institucional‑only” activo (flag ON) sin indicadores retail en output/logs.
- VSA y Market Profile dedicados integrados en SQA y API.
- Consenso 3/6 visible en API/Modal UI.
- Selector de modo mínimo reportando modo/score.
- Execution advisor entregando sugerencias y registrando métricas cuando aplique.

---

## 🧾 Anexos (marcadores SPEC_REF para código)

- `// SPEC_REF: docs/TECHNICAL_SPECS/OPTIMIZATION_MODE_INTELL.md#p1 (InstitutionalRealtimeService)`
- `// SPEC_REF: docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md#vsa`
- `// SPEC_REF: docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md#market-profile`
- `// SPEC_REF: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/SCALPING_MODE.md#multi-algoritmo`
- `// SPEC_REF: docs/TECHNICAL_SPECS/MODE_SELECTION_SPEC.md#mode-selection-logic`
- `// SPEC_REF: docs/TECHNICAL_SPECS/EXECUTION_ENGINE_SPEC.md#adaptive-execution`

---

Creado: 2025‑09‑13  
Autor: InteliBotX (plan operativo para Claude)  
Filosofía: Bot Único Institucional Anti‑Manipulación  
Compliance: DL‑001 · DL‑002 · DL‑008 · GUARDRAILS P1–P9
