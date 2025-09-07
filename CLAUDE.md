# CLAUDE.md - InteliBotX Intelligent Trading Control Central
> **ÚNICO PUNTO ENTRADA SESIÓN** - Bot Único Institucional Anti-Manipulación

---

## 🎯 **CARGA INICIAL CADA SESIÓN**

### **SECUENCIA AUTOMÁTICA OBLIGATORIA - LECTURA COMPLETA:**
1. **LEER COMPLETO:** `docs/GOVERNANCE/CLAUDE_BASE.md` (reglas fundamentales cómo trabajar)
2. **LEER COMPLETO:** `docs/INTELLIGENT_TRADING/CORE_PHILOSOPHY.md` (principios bot único inteligente)  
3. **LEER COMPLETO:** `docs/SESSION_CONTROL/MASTER_PLAN.md` (estado actual proyecto + roadmap)
4. **LEER COMPLETO:** `docs/GOVERNANCE/GUARDRAILS.md` (metodología P1-P9 obligatoria)
5. **LEER COMPLETO:** `docs/GOVERNANCE/CLAUDE_INDEX.md` (índice referencias SPEC_REF)

### **🚨 PREMISA INELUDIBLE:**
- **LECTURA COMPLETA es OBLIGATORIA** - Sin excepciones, sin fragmentación
- **Metodología Claude irrelevante** - Debe leerse completo cada documento  
- **Carga inicial = BASE CONOCIMIENTO** completa antes de cualquier tarea

---

## 🧠 **NAVEGACIÓN INTELLIGENT TRADING**

### **Para FILOSOFÍA BOT ÚNICO:**
```
CLAUDE.md → INTELLIGENT_TRADING/CORE_PHILOSOPHY.md (principios anti-manipulación)
```

### **Para CONCEPTO BOT ÚNICO:**
```
CLAUDE.md → INTELLIGENT_TRADING/BOT_CONCEPT.md (qué es bot adaptativo)
```

### **Para ALGORITMOS INSTITUCIONALES:**
```
CLAUDE.md → INTELLIGENT_TRADING/ALGORITHMS_OVERVIEW.md (12 algoritmos conceptual)
CLAUDE.md → INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/ → algoritmo específico
```

### **Para MODOS OPERATIVOS:**
```
CLAUDE.md → INTELLIGENT_TRADING/MODES_OVERVIEW.md (5 modos conceptual)
CLAUDE.md → INTELLIGENT_TRADING/OPERATIONAL_MODES/ → modo específico
```

### **Para DESARROLLO/Código:**
```
CLAUDE.md → GOVERNANCE/ → TECHNICAL_SPECS/ → archivo específico → GUARDRAILS.md
```

### **Para ESTADO ACTUAL DEL SISTEMA:**
```
CLAUDE.md → SESSION_CONTROL/MASTER_PLAN.md (información dinámica)
```

---

## ⚠️ **PREMISAS INELUDIBLES - DECISIONES CRÍTICAS**

### **📋 DECISIONES FORMALES OBLIGATORIAS:**
- **DL-001:** Datos reales únicamente, no hardcode, no simulación
- **DL-002:** SOLO algoritmos institucionales Smart Money (NO retail RSI/MACD/EMA)  
- **DL-008:** Authentication centralizada - get_current_user_safe() (43 endpoints)
- **DL-040:** Feature-based architecture obligatoria
- **DL-076:** SUCCESS CRITERIA - Components ≤150 lines + specialized hooks pattern

### **🛡️ METODOLOGÍA GUARDRAILS OBLIGATORIA:**
- **P1-P9:** Metodología completa documentada en `GUARDRAILS.md`
- **PROHIBIDO:** Asumir, suponer, hacer hipótesis sin verificación
- **REQUERIDO - ZERO TOLERANCIA:** Análisis de impacto antes de cualquier cambio
- **REQUERIDO - ZERO TOLERANCIA:** Lectura completa documentos sin excepciones  
- **REQUERIDO - ZERO TOLERANCIA:** Plan rollback antes de implementar cambios
- **CRÍTICO - APLICACIÓN OBLIGATORIA:** No romper código funcional innecesariamente
- **CRÍTICO - APLICACIÓN OBLIGATORIA:** Validación con herramientas (grep, read, test) - NO suposiciones
- **CRÍTICO - APLICACIÓN OBLIGATORIA:** Confirmación usuario antes de cambios estructurales

### **🎯 PRINCIPIOS BOT ÚNICO:**
- **Adaptabilidad Total:** Bot decide modo según análisis real-time
- **Anti-Manipulación:** Protección > ganancias excesivas  
- **Ganancia Rápida:** 1% seguro > 5% incierto por manipulación
- **ML Continuo:** Aprendizaje de cada trade para evolución
- **UN bot inteligente:** NO múltiples bots estáticos

---

## 📁 **DOCUMENTOS CRÍTICOS REORGANIZADOS**

### **🧠 INTELLIGENT_TRADING (Core Sistema):**
- `CORE_PHILOSOPHY.md` - Visión bot único anti-manipulación
- `BOT_CONCEPT.md` - Concepto bot adaptativo vs bots tradicionales
- `ALGORITHMS_OVERVIEW.md` - 12 algoritmos institucionales conceptual
- `MODES_OVERVIEW.md` - 5 modos operativos institucionales

### **🎯 OPERATIONAL_MODES (Modos Institucionales):**
- `SCALPING_MODE.md` - Smart Scalper (base institucional)
- `TREND_FOLLOWING_MODE.md` - SMC + Market Profile + VSA
- `ANTI_MANIPULATION_MODE.md` - Composite Man + Order Flow
- `NEWS_SENTIMENT_MODE.md` - Central Bank + Options Flow
- `VOLATILITY_ADAPTIVE_MODE.md` - VSA + Market Profile adaptive

### **🏛️ INSTITUTIONAL_ALGORITHMS (12 Algoritmos):**
- `01_WYCKOFF_METHOD.md` ✅ - `07_VOLUME_SPREAD_ANALYSIS.md` ❌
- `02_ORDER_BLOCKS.md` ✅ - `08_MARKET_PROFILE.md` ❌  
- `03_LIQUIDITY_GRABS.md` ✅ - `09_SMART_MONEY_CONCEPTS.md` ❌
- `04_STOP_HUNTING.md` ✅ - `10_INSTITUTIONAL_ORDER_FLOW.md` ❌
- `05_FAIR_VALUE_GAPS.md` ✅ - `11_ACCUMULATION_DISTRIBUTION.md` ❌
- `06_MARKET_MICROSTRUCTURE.md` ✅ - `12_COMPOSITE_MAN_THEORY.md` ❌

### **🏛️ GOVERNANCE (Control):**
- `CLAUDE_BASE.md` - Premisas fundamentales + flujo obligatorio
- `DECISION_LOG.md` - DL-001/002/008/040/076 decisiones críticas
- `GUARDRAILS.md` - Metodología P1-P9 + reglas protección crítica
- `CLAUDE_INDEX.md` - Índice navegación + referencias SPEC_REF

### **🎯 SESSION_CONTROL (Planificación):**
- `MASTER_PLAN.md` - Estado dinámico actual del sistema + roadmap
- `BACKLOG.md` - Tareas pendientes + prioridades actualizadas
- `TODO_INBOX.md` - Gestión tareas + items nuevos

### **🚀 DEPLOYMENT (Infraestructura):**
- `DEPLOYMENT_GUIDE.md` - Guía deployment Railway + Vercel
- `POSTGRESQL_MIGRATION.md` - Migraciones base datos críticas
- `CPANEL_EMAIL_CONFIG.md` - Configuración email sistema
- `MIGRATIONS.md` - Control migraciones + rollback

### **🎨 DESIGN (UX/UI):**
- `DESIGN_SYSTEM.md` - Sistema diseño + patrones UX + navegación

### **⚙️ TECHNICAL_SPECS (Implementación):**
- `FRONTEND_ARCHITECTURE.md` - SUCCESS CRITERIA + feature-based architecture
- `BOT_ARCHITECTURE_SPEC.md` - Arquitectura técnica bot único
- `ALGORITMOS_SPEC.md` - Especificaciones técnicas algoritmos
- `ENDPOINTS_ANALYSIS.md` - Análisis completo 89 APIs: Railway vs Frontend
- `APIS_COMPLETE_DETAILED_MATRIX.md` - Matriz completa APIs sistema
- `ML_LEARNING_SPEC.md` - Machine Learning + aprendizaje continuo
- `MODE_SELECTION_SPEC.md` - IA selección modos operativos
- `EXECUTION_ENGINE_SPEC.md` - Motor ejecución adaptativo
- `EXCHANGE_MANAGEMENT.md` - Gestión exchanges + credenciales
- `ESTRATEGIAS_BOTS.md` - Estrategias trading implementadas
- `BOTS_USUARIO_SPEC.md` - Especificaciones bots usuario

---

## 🔄 **FLUJO SESIÓN INSTITUCIONAL**

### **APERTURA - CARGA COMPLETA OBLIGATORIA:**
```
USUARIO DICE: "Cargar CLAUDE.md"
CLAUDE LEE COMPLETO: CLAUDE_BASE → CORE_PHILOSOPHY → MASTER_PLAN → GUARDRAILS → CLAUDE_INDEX
RESULTADO: Base conocimiento COMPLETA en memoria antes de cualquier tarea
```

### **METODOLOGÍA OBLIGATORIA:**
- **Ver:** `GUARDRAILS.md` (P1-P9 mandatory + metodología completa)
- **Ver:** `CLAUDE_BASE.md` (premisas inmutables + flujo obligatorio)  
- **Ver:** `DECISION_LOG.md` (DL-001/002/008/040/076 compliance crítico)

### **CIERRE:**
- **MASTER_PLAN.md** actualizado con progreso
- **DECISION_LOG.md** actualizado si decisiones arquitectónicas

---

*Actualizado: 2025-09-06 - Carga Inicial Optimizada + Lectura Completa Obligatoria*  
*Paradigma: Bot Único Institucional Adaptativo*  
*Función: Master Entry Point + Navigation Control + Complete Knowledge Base*  
*Carga Inicial: 5 documentos completos obligatorios (1,255+ líneas total)*  
*Estado del Sistema: Ver MASTER_PLAN.md para información dinámica*  
*Metodología: GUARDRAILS P1-P9 + Lectura Completa Sin Excepciones*  
*Objetivo: Protección capital + ganancias consistentes anti-manipulación*