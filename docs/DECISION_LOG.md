# DECISION_LOG.md · Registro de Decisiones

> **Regla:** Cada entrada debe tener fecha, ID único (`DL-###`), `SPEC_REF`, impacto y rollback.

---

## 2025-08-12 — DL-002 · Política algoritmos institucionales únicamente
**Contexto:** InteliBotX debe ser solución profesional e institucional, no básica.  
**Decisión:** Solo algoritmos de nivel institucional/Smart Money. Eliminar indicadores retail.  
**Algoritmos ELIMINADOS:** EMA_CROSSOVER, RSI_OVERSOLD, MACD_DIVERGENCE (nivel retail).  
**Algoritmos CORE:** Wyckoff, Order Blocks, Liquidity Grabs, Stop Hunting, Fair Value Gaps.  
**Impacto:** Mayor diferenciación vs competencia retail (3Commas, etc.).  
**Rollback:** Git revert + restaurar enum AlgorithmType.  
**SPEC_REF:** CLAUDE_BASE.md#no-hardcode + advanced_algorithm_selector.py

---

## YYYY-MM-DD — DL-001 · Política no-hardcode / no-simulación / no-rupturas
**Contexto:** Evitar pérdida de persistencia y "sancocho" de código.  
**Decisión:** Toda lógica debe basarse en DB/APIs reales; nada temporal.  
**Alternativas:** Simulación / localStorage → descartadas.  
**Impacto:** Frontend (servicios/API); Backend (persistencia).  
**SPEC_REF:** ENDPOINTS_ANALYSIS.md#persistencia-trading-ops  
**Rollback:** Revertir commits y restaurar schema previo.

---

## 2025-08-12 — DL-003 · Política lazy imports para evitar deadlocks Railway
**Contexto:** Servicio Railway inaccesible por deadlock en startup de FastAPI.  
**Decisión:** Todos los imports de servicios deben ser lazy (dentro de funciones).  
**Implementación:** Smart Scalper services movidos de module-level a function-level imports.  
**Impacto:** Startup tiempo <5s vs >30s timeout previo. Health check funcional.  
**Rollback:** Git revert + restaurar imports de módulo en routes/bots.py.  
**SPEC_REF:** routes/bots.py + main.py startup event

---

## 2025-08-12 — DL-004 · Eliminación definitiva flujo retail - Solo algoritmos institucionales
**Contexto:** Sistema híbrido con algoritmos retail (RSI/MACD/CSV) + institucionales (Smart Scalper) generaba confusión y errores.  
**Decisión:** ELIMINAR completamente flujo retail. SIEMPRE usar algoritmos institucionales Smart Money.  
**Cambios realizados:**  
- ❌ Eliminado: líneas 387-442 routes/bots.py (CSV + StrategyEvaluator retail)  
- ✅ SIEMPRE ejecutar: execute_smart_scalper_analysis (Wyckoff, Order Blocks, etc.)  
- ✅ Frontend estandarizado: scalper_mode=true en todas las llamadas  
- ✅ Corregido: imports TimeframeData para resolver Error 500  
**Impacto:** Usuarios ya no reciben señales retail accidentalmente. Experiencia consistente.  
**Rollback:** Git revert + restaurar if scalper_mode condicional en routes/bots.py.  
**SPEC_REF:** SMART_SCALPER_STRATEGY.md + routes/bots.py + frontend components

---

## 2025-08-12 — DL-005 · Migración SQLite → PostgreSQL persistente Railway
**Contexto:** SQLite ephemeral en Railway causa pérdida datos por múltiples instancias + filesystem temporal.  
**Decisión:** Migrar a PostgreSQL Railway nativo para persistencia robusta real.  
**Justificación:** Cumple DL-001 (APIs reales, no temporal) + ETAPA 2 (trading en vivo real).  
**Alternativas evaluadas:** MongoDB (descartado - alto impacto cambios) vs PostgreSQL (mínimo impacto).  
**Implementación:** Solo cambio DATABASE_URL + Railway PostgreSQL service, schema compatible.  
**Impacto:** Elimina pérdida datos, permite scaling real, soporta trading institucional persistente.  
**Rollback:** Revertir DATABASE_URL + restaurar init-db SQLite ephemeral.  
**SPEC_REF:** PLAN_SESION.md#persistencia-robusta + Railway PostgreSQL addon

---

## 2025-08-12 — DL-006 · Eliminación completa hardcode - Compliance DL-001 estricto ✅ **RESUELTO**
**Contexto:** Detectado hardcode crítico que viola DL-001 (no-hardcode) en 22+ instancias.  
**Decisión:** ELIMINAR todo hardcode antes de migración PostgreSQL. Usar variables entorno + auth.  
**Hardcode DETECTADO:**  
- ❌ DATABASE_URL hardcoded (8 instancias) → os.getenv("DATABASE_URL")  
- ❌ user_id=1 hardcoded (6 instancias) → JWT auth get_current_user()  
- ❌ "admin123"/"admin@intelibotx.com" → variables entorno  
- ❌ "BTCUSDT" fallbacks → configuración dinámica  
**Impacto:** Sistema NO-scalable, security risk, incompatible Railway PostgreSQL.  
**Rollback:** Git revert + restaurar hardcode temporal (NO RECOMENDADO).  
**SPEC_REF:** DL-001 + PLAN_SESION.md#hardcode-elimination + Railway PostgreSQL compatibility  
**RESOLUCIÓN:** ✅ **E2E CLEAN COMPLETADO 2025-08-13** - Sistema DL-001 compliant

---

## 2025-08-13 — DL-007 · E2E Clean Plan - Arquitectura robusta establecida
**Contexto:** Sistema contenía 22+ violaciones DL-001 distribuidas en 6 capas arquitectónicas.  
**Decisión:** Ejecutar plan E2E clean de 6 etapas secuenciales antes de PostgreSQL migration.  
**ETAPAS COMPLETADAS:**
1. ✅ AUTH SYSTEM ROBUSTO - Email verification + Password recovery + CORS security + Admin hardcode eliminado
2. ✅ EXCHANGE CONFIG CLEAN - DL-001 violations resolved: is_testnet default=True eliminado  
3. ✅ BOT CREATION CLEAN - DL-001 violations resolved: symbol="BTCUSDT", market_type, leverage defaults eliminados
4. ✅ SMART SCALPER ENGINE CLEAN - 104 líneas test/debug eliminadas, solo datos reales Binance
5. ✅ DASHBOARD REAL DATA - YA COMPLETAMENTE LIMPIO, validado 4/4 endpoints auth + métricas dinámicas
6. ✅ FRONTEND SCOPE REDUCTION - SmartIntelligence/SmartTrade comentados, core pages mantenidas  
**RESULTADO:** Sistema production-ready, datos reales únicamente, DL-001 compliant.  
**PRÓXIMOS PASOS:** PostgreSQL migration desbloqueada, deploy producción, E2E testing.  
**SPEC_REF:** PLAN_SESION.md actividades subsiguientes + BACKLOG.md prioridades actualizadas

---

## YYYY-MM-DD — DL-008 · …