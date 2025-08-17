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

### **🚨 PRIORIDADES INMEDIATAS HOY 2025-08-16** ⚠️ **ACTUALIZADO POR USUARIO**
- [ ] {AUTHENTICATION_DEPENDENCY_FIX_REMAINING} **Fix endpoints dependency injection restantes** — Continuar aplicando Opción B metodología exitosa
  *(SPEC_REF: Auth module 8/11 endpoints + otros módulos pendientes)*
- [ ] {POST_EXCHANGES_PRD_DEBUG} **Debug POST /exchanges en PRD** — Usuario reporta que aún no funciona post-deployment
  *(SPEC_REF: Validar hallazgos comportamiento PRD vs local testing)*
- [x] {EXCHANGE_OPENAPI_FIX} **OpenAPI schema fixed** — ✅ **COMPLETADO 2025-08-15** Forward references resueltos
- [x] {POST_EXCHANGES_OPTION_B} **POST /exchanges Opción B implementada** — ✅ **COMPLETADO 2025-08-15** Manual auth + lazy imports
- [ ] {EXCHANGE_TESTING_REAL} **Exchange testing con credenciales reales** — API connection validation post-fix
  *(SPEC_REF: Pendiente validación POST funcional + otros 6 endpoints)*
- [ ] {BOT_CREATION_TESTING} **Bot creation endpoint testing** — Validar create-bot post auth fix
  *(SPEC_REF: 10 endpoints bots.py con mismo issue dependency injection)*
### **🔄 PRIORIDADES FUTURAS (PRÓXIMA VENTANA)**
- [ ] {ENCRYPTION_MASTER_KEY_RAILWAY} **CRÍTICO: Configurar ENCRYPTION_MASTER_KEY seguro** — Credenciales no persisten + evaluar alternativas seguridad
  *(SPEC_REF: Usuario testing E2E 2025-08-16 - ERROR: Failed to decrypt credentials + análisis seguridad)*
- [ ] {WEBSOCKET_LAZY_IMPORTS_COMPLETE} **WebSocket lazy imports** — Revertir disable + aplicar lazy imports RealtimeDataManager  
  *(SPEC_REF: DL-001 compliance final)*

### **📊 PROGRESO DEPENDENCY INJECTION - 2025-08-16**
- [x] {POST_EXCHANGES_OPTION_B_DONE} **POST /exchanges Opción B** — ✅ **COMPLETADO** Manual JWT auth implementado
- [x] {GET_EXCHANGES_FIX} **GET /exchanges dependency fix** — ✅ **COMPLETADO** Opción B manual auth + session fix aplicado
- [x] {PUT_EXCHANGES_FIX} **PUT /exchanges/{id} dependency fix** — ✅ **COMPLETADO** Opción B implementada (línea 242-285 routes/exchanges.py) 
- [x] {DELETE_EXCHANGES_FIX} **DELETE /exchanges/{id} dependency fix** — ✅ **COMPLETADO** Opción B implementada (línea 340-385 routes/exchanges.py)
- [x] {TEST_EXCHANGES_FIX} **POST /exchanges/{id}/test dependency fix** — ✅ **COMPLETADO** Opción B implementada (línea 409-500 routes/exchanges.py)
- [x] {BALANCE_EXCHANGES_FIX} **GET /exchanges/{id}/balance dependency fix** — ✅ **COMPLETADO** YA TIENE Opción B aplicada (línea 542-638 routes/exchanges.py)
- [x] {MARKET_TYPES_FIX} **GET /exchanges/{id}/market-types dependency fix** — ✅ **COMPLETADO** Opción B implementada (línea 641-700 routes/exchanges.py)
- [x] {BOT_CREATION_VALIDATION_FIX} **POST /api/create-bot exchange validation** — ✅ **COMPLETADO 2025-08-16** Validación exchange_id + DL-001 compliance
- [ ] {BOTS_ENDPOINTS_FIX} **9 otros endpoints bots.py dependency fix** — Pendiente (routes/bots.py líneas restantes)
- [ ] {AUTH_ENDPOINTS_FIX} **11 endpoints auth.py dependency fix** — Pendiente (routes/auth.py múltiples líneas)
- [ ] {TRADING_OPS_FIX} **5 endpoints trading_operations.py dependency fix** — Pendiente
- [ ] {REAL_TRADING_FIX} **3 endpoints real_trading_routes.py dependency fix** — Pendiente
- [ ] {DASHBOARD_API_FIX} **3 endpoints dashboard_api.py dependency fix** — Pendiente  
- [ ] {DASHBOARD_DATA_FIX} **4 endpoints dashboard_data.py dependency fix** — Pendiente

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