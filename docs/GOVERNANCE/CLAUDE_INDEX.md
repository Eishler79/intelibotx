# Índice de referencia (LEER-PRIMERO) {#indice}

> Usa este índice para ubicar la **fuente de verdad** antes de tocar código.
> Cuando cites en commits o comentarios en código, usa `SPEC_REF: archivo.md#seccion`.

## Intelligent Trading (Core Sistema) {#intelligent-trading}
- docs/INTELLIGENT_TRADING/CORE_PHILOSOPHY.md {#core-philosophy}
- docs/INTELLIGENT_TRADING/BOT_CONCEPT.md {#bot-concept}
- docs/INTELLIGENT_TRADING/ALGORITHMS_OVERVIEW.md {#algorithms-overview}
- docs/INTELLIGENT_TRADING/MODES_OVERVIEW.md {#modes-overview}

### Institutional Algorithms {#institutional-algorithms}
- docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/01_WYCKOFF_METHOD.md {#wyckoff}
- docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/02_ORDER_BLOCKS.md {#order-blocks}
- docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/03_LIQUIDITY_GRABS.md {#liquidity-grabs}
- docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/04_STOP_HUNTING.md {#stop-hunting}
- docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/05_FAIR_VALUE_GAPS.md {#fair-value-gaps}
- docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/06_MARKET_MICROSTRUCTURE.md {#market-microstructure}

### Operational Modes {#operational-modes}
- docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/SCALPING_MODE.md {#scalping-mode}
- docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/TREND_FOLLOWING_MODE.md {#trend-following}
- docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/ANTI_MANIPULATION_MODE.md {#anti-manipulation}
- docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/NEWS_SENTIMENT_MODE.md {#news-sentiment}
- docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/VOLATILITY_ADAPTIVE_MODE.md {#volatility-adaptive}

## Governance {#governance}
- docs/GOVERNANCE/CLAUDE_BASE.md {#claude-base}
- docs/GOVERNANCE/GUARDRAILS.md {#guardrails}
- docs/GOVERNANCE/DECISION_LOG.md {#decision-log}

## Deployment & Infrastructure {#deployment}
- docs/DEPLOYMENT/DEPLOYMENT_GUIDE.md {#deployment-guide}
- docs/DEPLOYMENT/POSTGRESQL_MIGRATION.md {#postgresql-migration}
- docs/DEPLOYMENT/CPANEL_EMAIL_CONFIG.md {#cpanel-email}

## Design System {#design}
- docs/DESIGN/DESIGN_SYSTEM.md {#design-system}

## Technical Specifications {#technical-specs}
- docs/TECHNICAL_SPECS/FRONTEND_ARCHITECTURE.md {#frontend-architecture}
- docs/TECHNICAL_SPECS/BOTSMODULAR_ARCHITECTURE.md {#botsmodular-architecture} ✅ NEW
- docs/TECHNICAL_SPECS/BOT_ARCHITECTURE_SPEC.md {#bot-architecture}
- docs/TECHNICAL_SPECS/ENDPOINTS_ANALYSIS.md {#endpoints-analysis}
- docs/TECHNICAL_SPECS/BOTS_USUARIO_SPEC.md {#bots-usuario-spec}
- docs/TECHNICAL_SPECS/EXCHANGE_MANAGEMENT.md {#exchange-management}
- docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md {#algoritmos-spec}
- docs/TECHNICAL_SPECS/ESTRATEGIAS_BOTS.md {#estrategias-bots}
- docs/TECHNICAL_SPECS/EXECUTION_ENGINE_SPEC.md {#execution-engine}
- docs/TECHNICAL_SPECS/ML_LEARNING_SPEC.md {#ml-learning}
- docs/TECHNICAL_SPECS/MODE_SELECTION_SPEC.md {#mode-selection}
- docs/TECHNICAL_SPECS/APIS_COMPLETE_DETAILED_MATRIX.md {#apis-matrix}

## Frontend {#frontend}
- frontend/src/services/api.ts — fuente de verdad de llamadas {#api-ts}
- frontend/src/routes/App.jsx — routing principal {#app-routes}
- frontend/src/pages/BotsModular.jsx — controller principal bots ACTIVO {#bots-modular}
- frontend/src/pages/BotsAdvanced.jsx — LEGACY (rollback safety) {#bots-advanced}

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

---

### Ejemplos de referencias SPEC_REF (copiar/pegar) {#ejemplos}
- `// SPEC_REF: docs/INTELLIGENT_TRADING/CORE_PHILOSOPHY.md#core-philosophy`
- `// SPEC_REF: docs/GOVERNANCE/CLAUDE_BASE.md#claude-base` 
- `// SPEC_REF: docs/SESSION_CONTROL/MASTER_PLAN.md#master-plan`
- `// SPEC_REF: docs/GOVERNANCE/DECISION_LOG.md#decision-log (DL-XXX)`
- `// SPEC_REF: docs/TECHNICAL_SPECS/ENDPOINTS_ANALYSIS.md#endpoints-analysis`
- `// SPEC_REF: docs/DESIGN/DESIGN_SYSTEM.md#design-system`
- `// SPEC_REF: frontend/src/services/api.ts#api-ts`
- `// SPEC_REF: frontend/src/pages/BotsAdvanced.jsx#bots-advanced`

---

*Actualizado: 2025-09-06 - Sincronizado con estructura real del proyecto*  
*Todos los documentos referenciados existen y están verificados*