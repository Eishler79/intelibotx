# PLAN_SESION.md · Plan de Sesión — 2025-08-12

> **Regla:** Máx. 2 objetivos clave por sesión.  
> Las tareas deben tener `SPEC_REF` para ejecutarse.

---

## 🎯 Objetivos del día
1. **Depurar y estabilizar proyecto** - Auditoría completa + limpieza archivos obsoletos
2. **Preparar ETAPA 1: Core Engine Avanzado** - Resolver puntos de atención pendientes

---

## 🔄 Tareas activas (hacer ahora)
### **🏛️ ETAPA 1: Core Engine Avanzado (preparado)**
- [ ] {CORE01} MarketMicrostructureAnalyzer implementation *(SPEC_REF: SMART_SCALPER_STRATEGY.md)*
- [ ] {CORE02} InstitutionalDetector: Stop hunting, liquidity grabs *(SPEC_REF: SMART_SCALPER_STRATEGY.md)*
- [ ] {CORE03} MultiTimeframeCoordinator: 1m-5m-15m-1H sync *(SPEC_REF: SMART_SCALPER_STRATEGY.md)*
- [ ] {CORE04} SignalQualityAssessor: Multi-confirmation validation *(SPEC_REF: SMART_SCALPER_STRATEGY.md)*

### **💀 ALGORITMOS ANTI-MANIPULACIÓN (Smart Scalper Asesino)**
- [ ] {ALGO01} FAKE_BREAKOUT_DETECTOR - Detecta rupturas falsas retail *(SPEC_REF: SMART_SCALPER_STRATEGY.md)*
- [ ] {ALGO02} WHALE_WALLET_TRACKER - Rastreo carteras grandes on-chain *(SPEC_REF: SMART_SCALPER_STRATEGY.md)*
- [ ] {ALGO03} SESSION_MANIPULATION_FILTER - Manipulación por sesiones *(SPEC_REF: SMART_SCALPER_STRATEGY.md)*
- [ ] {ALGO04} ALGORITHM_PATTERN_BREAKER - Rompe patrones retail *(SPEC_REF: SMART_SCALPER_STRATEGY.md)*
- [ ] {ALGO05} VOLATILITY_SPIKE_PREDICTOR - Predice manipulación pre-news *(SPEC_REF: SMART_SCALPER_STRATEGY.md)*
- [ ] {ALGO06} LIQUIDITY_SWEEP_ANTICIPATOR - Anticipa barridas liquidez *(SPEC_REF: SMART_SCALPER_STRATEGY.md)*

---

## 🔍 Descubrimientos (candidatos a tarea)
- [x] (discovery) Backend 404 en Railway - posible problema deploy
- [x] (discovery) GUARDRAILS.md desactualizado vs realidad proyecto
- [x] (discovery) Archivos .MD obsoletos en raíz ocupando espacio

---

## ⛔ Bloqueadores
- [ ] (blocker) Backend no responde en Railway → impide validar APIs en producción

---

## 📌 Cambios de alcance (hoy)
- **+** Agregado: Auditoría completa proyecto + sincronización GUARDRAILS.md
- **+** Agregado: Limpieza archivos obsoletos + reorganización /docs/
- **+** Agregado: 6 algoritmos anti-manipulación "Smart Scalper Asesino"
- **+** Agregado: Validación archivos estratégicos (4 críticos confirmados)
- **–** Quitado: Avance directo ETAPA 1 hasta estabilizar base

---

## ✅ Hecho hoy (cerrado en esta sesión)
- [x] {AUD01} Auditoría completa estructura proyecto realizada
- [x] {AUD02} Clasificación archivos .MD raíz - importantes vs obsoletos  
- [x] {AUD03} GUARDRAILS.md sincronizado con archivos realmente críticos
- [x] {CLEAN01} Eliminados archivos obsoletos: CLAUDE.md, PLAN_PRÓXIMA_SESIÓN.md, PLAN_TRABAJO_INTELIBOTX.txt
- [x] {CLEAN02} Movidos archivos valiosos a /docs/ y actualizado CLAUDE_INDEX.md
- [x] {T01} Deploy fix método POST a producción - Changes propagados
- [x] {T02} Depuración algoritmos institucionales - Solo Smart Money (8 algoritmos)
- [x] {T03} JSON Parse errors - Error 405 identificado (deploy en progreso)
- [x] {T04} Bots RUNNING investigación - Endpoints simulados detectados
- [x] {VAL_EST} Validación archivos estratégicos - 4 críticos + 2 importantes confirmados