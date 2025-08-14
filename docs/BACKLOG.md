# BACKLOG.md · InteliBotX (Prioridades Vivas)

> **Regla:** Cada ítem debe tener `SPEC_REF` para poder ser ejecutado.  
> Si no hay `SPEC_REF`, debe ir primero a `TODO_INBOX.md`.

---

## 🔴 Alto (Prioridad inmediata) - Actualizado 2025-08-14
- [x] {ERROR500_FIX} **Debug Error 500 endpoints Smart Scalper** — ✅ **RESUELTO 2025-08-13** - E2E clean completado
- [x] {CORE04} **SignalQualityAssessor implementation** — ✅ **COMPLETADO 2025-08-13** - Integrado en Smart Scalper
- [x] {FRONTEND_BACKEND_SYNC} **Frontend-Backend synchronization** — ✅ **COMPLETADO 2025-08-14** - CORS + lazy imports + dashboard APIs

### **🚀 PRIORIDADES INMEDIATAS ACTUALES - AUTH COMPLETION** ✅ **COMPLETADO 2025-08-14**
- [x] {DB_MIGRATION_RESUMIR} **Migración PostgreSQL definitiva** — ✅ **COMPLETADO 2025-08-13** Sistema + auth robusto funcional
- [x] {PRODUCTION_DEPLOY} **Deploy producción Railway** — ✅ **COMPLETADO 2025-08-13** 12/12 routers + PostgreSQL + lazy imports  
- [x] {REGISTRATION_E2E} **Registration E2E funcional** — ✅ **COMPLETADO 2025-08-14** Usuario e1g1@hotmail.com creado
- [x] {EMAIL_VERIFICATION_SYSTEM} **Email verification system completo** — ✅ **COMPLETADO 2025-08-14** SMTP + verification flow operativo
- [x] {PASSWORD_RECOVERY_SYSTEM} **Password recovery system funcional** — ✅ **COMPLETADO 2025-08-14** Reset password E2E workflow  
- [x] {LOGIN_E2E_COMPLETION} **Login E2E completion** — ✅ **COMPLETADO 2025-08-14** Auth flow completo + dashboard access
- [x] {MASSIVE_AUTH_FIX} **Authentication architecture fix** — ✅ **COMPLETADO 2025-08-14** 43 endpoints corregidos CORS 500→401

### **🚨 PRIORIDADES PRÓXIMA SESIÓN 2025-08-15**
- [ ] {EXCHANGE_VALIDATION_DEBUG} **Debug exchange validation error** — Error persiste post-auth fix  
  *(SPEC_REF: CORS/Auth issues resolved pero exchange add sigue fallando)*
- [ ] {EXCHANGE_TESTING_REAL} **Exchange testing con credenciales reales** — API connection validation  
  *(SPEC_REF: Binance/ByBit testnet + mainnet connection testing)*
- [ ] {WEBSOCKET_LAZY_IMPORTS_COMPLETE} **WebSocket lazy imports** — Revertir disable + aplicar lazy imports RealtimeDataManager  
  *(SPEC_REF: DL-001 compliance final)*

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