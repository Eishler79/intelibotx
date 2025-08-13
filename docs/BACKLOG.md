# BACKLOG.md · InteliBotX (Prioridades Vivas)

> **Regla:** Cada ítem debe tener `SPEC_REF` para poder ser ejecutado.  
> Si no hay `SPEC_REF`, debe ir primero a `TODO_INBOX.md`.

---

## 🔴 Alto (Prioridad inmediata)
- [x] {ERROR500_FIX} **Debug Error 500 endpoints Smart Scalper** — ✅ **RESUELTO 2025-08-13** - E2E clean completado
- [x] {CORE04} **SignalQualityAssessor implementation** — ✅ **COMPLETADO 2025-08-13** - Integrado en Smart Scalper

### **🚀 PRIORIDADES INMEDIATAS - SISTEMA FUNCIONAL**
- [x] {DB_MIGRATION_RESUMIR} **Migración PostgreSQL definitiva** — ✅ **COMPLETADO 2025-08-13** Sistema + auth robusto funcional
- [x] {PRODUCTION_DEPLOY} **Deploy producción Railway** — ✅ **COMPLETADO 2025-08-13** 11/11 routers + PostgreSQL + lazy imports  
- {E2E_TESTING} **Testing E2E completo** — Validar flujo: Auth → Exchange → Bot → Trading  
  *(SPEC_REF: Sistema 11/11 routers funcional)*
- {EXCHANGE_VALIDATION_REAL} **Validación conexiones reales** — Testear exchanges con credenciales usuario  
  *(SPEC_REF: DL-001 compliance + datos reales)*

### **🔄 POST-E2E COMPLETION**
- {WEBSOCKET_LAZY_IMPORTS_COMPLETE} **WebSocket lazy imports completos** — Revertir disable + aplicar lazy imports RealtimeDataManager  
  *(SPEC_REF: DL-001 no-temporal + práctica completa)*

---

## 🟡 Medio (Próxima ventana)
- {ALGO01} **FAKE_BREAKOUT_DETECTOR** — Detecta rupturas falsas retail para Smart Scalper Asesino  
  *(SPEC_REF: SMART_SCALPER_STRATEGY.md#anti-manipulation)*
- {ALGO02} **WHALE_WALLET_TRACKER** — Rastreo carteras grandes on-chain  
  *(SPEC_REF: SMART_SCALPER_STRATEGY.md#anti-manipulation)*
- {ALGO03} **SESSION_MANIPULATION_FILTER** — Filtro manipulación por sesiones  
  *(SPEC_REF: SMART_SCALPER_STRATEGY.md#anti-manipulation)*
- {ALGO04} **ALGORITHM_PATTERN_BREAKER** — Rompe patrones retail  
  *(SPEC_REF: SMART_SCALPER_STRATEGY.md#anti-manipulation)*
- {ALGO05} **VOLATILITY_SPIKE_PREDICTOR** — Predice manipulación pre-news  
  *(SPEC_REF: SMART_SCALPER_STRATEGY.md#anti-manipulation)*
- {ALGO06} **LIQUIDITY_SWEEP_ANTICIPATOR** — Anticipa barridas liquidez  
  *(SPEC_REF: SMART_SCALPER_STRATEGY.md#anti-manipulation)*
- [x] {CORS_FIX} **Corregir errores CORS frontend-backend** — ✅ **RESUELTO 2025-08-13** - CORS security hardened

---

## 🟢 Bajo (Mejoras / Nice-to-have)
- {ID} **Título** — 1 línea de resultado esperado  
  *(SPEC_REF: ARCHIVO.md#seccion)*

---

## ⏸ Aparcados / En espera
- {ID} **Título** — Motivo de espera o dependencia