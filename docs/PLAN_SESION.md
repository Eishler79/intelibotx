# PLAN_SESION.md · Plan de Sesión — 2025-08-12

> **Regla:** Máx. 2 objetivos clave por sesión.  
> Las tareas deben tener `SPEC_REF` para ejecutarse.

---

## 🎯 Objetivos del día
1. **Depurar y estabilizar proyecto** - Auditoría completa + limpieza archivos obsoletos
2. **Preparar ETAPA 1: Core Engine Avanzado** - Resolver puntos de atención pendientes

---

## 🔄 Tareas activas (hacer ahora)
- [ ] {T01} Deploy fix método POST a producción *(SPEC_REF: GUARDRAILS.md#deployment)*
- [ ] {T02} Eliminar EMA_CROSSOVER hardcodeado *(SPEC_REF: CLAUDE_BASE.md#no-hardcode)*
- [ ] {T03} Fix JSON Parse errors en respuestas servidor *(logs/debugging)*
- [ ] {T04} Investigar bots RUNNING sin trading *(SPEC_REF: ENDPOINTS_ANALYSIS.md#endpoints)*

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
- **–** Quitado: Avance directo ETAPA 1 hasta estabilizar base

---

## ✅ Hecho hoy (cerrado en esta sesión)
- [x] {AUD01} Auditoría completa estructura proyecto realizada
- [x] {AUD02} Clasificación archivos .MD raíz - importantes vs obsoletos  
- [x] {AUD03} GUARDRAILS.md sincronizado con archivos realmente críticos
- [x] {CLEAN01} Eliminados archivos obsoletos: CLAUDE.md, PLAN_PRÓXIMA_SESIÓN.md, PLAN_TRABAJO_INTELIBOTX.txt
- [x] {CLEAN02} Movidos archivos valiosos a /docs/ y actualizado CLAUDE_INDEX.md