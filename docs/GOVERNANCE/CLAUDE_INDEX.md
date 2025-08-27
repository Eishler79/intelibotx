# Índice de referencia (LEER-PRIMERO) {#indice}

> Usa este índice para ubicar la **fuente de verdad** antes de tocar código.
> Cuando cites en commits o comentarios en código, usa `SPEC_REF: archivo.md#seccion`.

## Diseño / Visión {#diseno-vision}
- docs/CONTEXTO_PLAN_3_FRENTES.md {#ctx-plan-3-frentes}
- DESIGN_SYSTEM_INTELIBOTX.md {#design-system}
- docs/BOT_TEMPLATES_STRATEGIES.md {#bot-templates}
- docs/ESPECIFICACIONES_BOTS_USUARIO.md {#specs-bots-usuario}
- docs/ESPECIFICACIONES_EXCHANGE_MANAGEMENT.md {#specs-exchange-mgmt}

## Backend {#backend}
- ENDPOINTS_ANALYSIS.md {#endpoints}
- DOCUMENTACION_ESTRATEGIAS_BOTS.md {#estrategias-bots}
- DEPLOYMENT_GUIDE.md {#deployment-guide}
- README.md (comandos backend) {#backend-readme}

## Frontend {#frontend}
- SMART_SCALPER_STRATEGY.md {#smart-scalper-strategy}
- SMART_SCALPER_ANALYTICS_DETAILED.md {#smart-scalper-analytics}
- src/services/api.ts — fuente de verdad de llamadas {#api-ts}
- pages/BotsAdvanced.jsx — controller principal de bots {#bots-advanced}

## Sesión (vivo) {#sesion}
- CLAUDE.md — master entry point, premisas KK/KG/KO {#claude-master}
- MASTER_PLAN.md — roadmap + estado actual sistema {#master-plan}
- BACKLOG.md — prioridades pendientes organizadas {#backlog}
- DECISION_LOG.md — registro decisiones críticas {#decision-log}
- SESSION_CLOSURE_YYYY-MM-DD.md — cierre sesión detallado {#session-closure}

---

### Ejemplos de referencias (copiar/pegar) {#ejemplos}
- `// SPEC_REF: CLAUDE.md#claude-master` 
- `// SPEC_REF: MASTER_PLAN.md#master-plan`
- `// SPEC_REF: DECISION_LOG.md#decision-log (DL-038)`
- `// SPEC_REF: BACKLOG.md#backlog`
- `// SPEC_REF: ENDPOINTS_ANALYSIS.md#endpoints`
- `# SPEC_REF: DOCUMENTACION_ESTRATEGIAS_BOTS.md#estrategias-bots`
- `// SPEC_REF: SMART_SCALPER_STRATEGY.md#smart-scalper-strategy`
- `# SPEC_REF: DESIGN_SYSTEM_INTELIBOTX.md#design-system`
- `// SPEC_REF: src/services/api.ts#api-ts`
- `// SPEC_REF: pages/BotsAdvanced.jsx#bots-advanced`

### Actualización DL-038 Session 2025-08-27 {#dl038-update}
- **Nueva Prioridad:** Bot modification data persistence fix
- **Status:** Root cause process identificado via diagnostic
- **SPEC_REF:** DECISION_LOG.md#decision-log (DL-038) + BotControlPanel data flow
- **Next Action:** Implement targeted fix for identified problematic process