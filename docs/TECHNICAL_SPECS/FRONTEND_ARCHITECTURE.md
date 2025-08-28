# FRONTEND_ARCHITECTURE.md - Arquitectura Frontend Feature-Based InteliBotX

> **OBJETIVO:** Refactoring arquitectural monolítico → feature-based sin breaking changes  
> **PARADIGMA:** Strangler Fig Pattern - migración incremental 100% segura  
> **FECHA:** 2025-08-28  
> **SPEC_REF:** DL-040 Frontend Architecture Refactoring

---

## 🔍 **ARQUITECTURA ACTUAL - ANÁLISIS CRÍTICO**

### **💀 COMPONENTES MONOLÍTICOS IDENTIFICADOS:**

#### **ARCHIVOS PROBLEMÁTICOS:**
```bash
BotsAdvanced.jsx:              1,096 líneas ❌ MEGA-MONOLITO
BotControlPanel.jsx:             851 líneas ❌ MEGA-MONOLITO  
SmartScalperMetrics.jsx:       1,444 líneas ❌ ULTRA-MONOLITO
EnhancedBotCreationModal.jsx:    600+ líneas ❌ MONOLITO
ProfessionalBotsTable.jsx:      400+ líneas ❌ GRANDE

TOTAL LÍNEAS PROBLEMÁTICAS: 4,400+ líneas en 5 archivos ❌
```

#### **PROBLEMAS ARQUITECTURALES CRÍTICOS:**
1. **Single Responsibility Violation:** BotsAdvanced.jsx hace 7+ responsabilidades
2. **Tight Coupling:** BotControlPanel depende de processedBots mapping confuso
3. **Componentes Duplicados:** 3+ páginas bots (Bots.jsx, BotsEnhanced.jsx, BotsAdvanced.jsx)
4. **Data Flow Confuso:** Backend → BotsAdvanced → processedBots → BotControlPanel (DL-038 root cause)
5. **Testing Imposible:** Monolitos no permiten unit testing aislado
6. **Development Fragility:** Cambio pequeño rompe funcionalidad distinta

### **📊 RESPONSABILIDADES AGLOMERADAS EN BotsAdvanced.jsx:**
```javascript
// BotsAdvanced.jsx HACE TODO (VIOLACIÓN SRP):
├── 📊 Dashboard metrics rendering     (debería ser Dashboard feature)
├── 🤖 Bot CRUD operations            (debería ser Bots feature)
├── 📈 Trading live monitoring        (debería ser Trading feature)
├── 🔄 Modal management               (debería ser Modal providers)
├── 🧭 Navigation tabs                (debería ser Navigation feature)
├── 🔐 Authentication handling        (debería ser Auth context)
├── 📡 API calls management           (debería ser Services layer)
├── 🧠 State management complex       (debería ser Context/Store)
├── ⚡ Real-time WebSocket           (debería ser WebSocket service)
└── 🎨 UI rendering múltiple          (debería ser UI components)
```

---

## 🎯 **ARQUITECTURA TARGET - FEATURE-BASED STRUCTURE**

### **🏗️ NUEVA ESTRUCTURA PROPUESTA:**

#### **PRINCIPIOS ARQUITECTURALES:**
1. **Feature-Based Organization:** Agrupación por dominio funcional
2. **Single Responsibility:** Un componente = una responsabilidad
3. **Separation of Concerns:** UI ≠ Logic ≠ Data ≠ State
4. **Dependency Inversion:** Components dependen de abstractions
5. **Open/Closed Principle:** Extensible sin modificar existente

#### **ESTRUCTURA COMPLETA:**
```javascript
src/
├── features/                           // ✅ FEATURE-BASED ORGANIZATION
│   │
│   ├── auth/                          // 🔐 AUTHENTICATION FEATURE
│   │   ├── components/
│   │   │   ├── LoginForm.jsx          // MOVE: components/auth/LoginPage.jsx
│   │   │   ├── RegisterForm.jsx       // MOVE: components/auth/RegisterPage.jsx
│   │   │   ├── ForgotPasswordForm.jsx // MOVE: pages/ForgotPassword.jsx
│   │   │   ├── ResetPasswordForm.jsx  // MOVE: pages/ResetPassword.jsx
│   │   │   ├── EmailVerification.jsx  // MOVE: pages/VerifyEmail.jsx
│   │   │   ├── AuthProviders.jsx      // MOVE: components/auth/AuthProviders.jsx
│   │   │   └── SessionModal.jsx       // MOVE: components/auth/SessionExpirationModal.jsx
│   │   ├── pages/
│   │   │   └── AuthPage.jsx           // CONSOLIDATE: Login.jsx + AuthPage.jsx
│   │   ├── guards/
│   │   │   ├── ProtectedRoute.jsx     // MOVE: components/auth/ProtectedRoute.jsx
│   │   │   └── ExchangeGuard.jsx      // MOVE: components/auth/ExchangeGuard.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js             // EXTRACT: from AuthContext.jsx
│   │   │   └── useAuthValidation.js   // EXTRACT: validation logic
│   │   ├── services/
│   │   │   └── authService.js         // EXTRACT: auth API calls from api.ts
│   │   └── contexts/
│   │       └── AuthContext.jsx        // MOVE: contexts/AuthContext.jsx
│   │
│   ├── dashboard/                     // 📊 DASHBOARD METRICS FEATURE
│   │   ├── components/
│   │   │   ├── DashboardMetrics.jsx   // EXTRACT: from BotsAdvanced.jsx dashboard section
│   │   │   ├── MetricCard.jsx         // EXTRACT: individual metric cards
│   │   │   ├── PerformanceCharts.jsx  // SPLIT: from SmartScalperMetrics.jsx
│   │   │   ├── PnLChart.jsx           // EXTRACT: P&L visualization
│   │   │   ├── LatencyMonitor.jsx     // MOVE: components/LatencyMonitor.jsx
│   │   │   └── TradingViewWidget.jsx  // MOVE: components/TradingViewWidget.jsx
│   │   ├── hooks/
│   │   │   ├── useDashboardMetrics.js // EXTRACT: dashboard state from BotsAdvanced.jsx
│   │   │   ├── useRealTimeMetrics.js  // EXTRACT: real-time updates logic
│   │   │   └── useChartData.js        // EXTRACT: chart data processing
│   │   ├── services/
│   │   │   └── dashboardService.js    // MOVE: services/dashboardService.js
│   │   └── pages/
│   │       └── DashboardPage.jsx      // REPLACE: Dashboard.jsx (if different from BotsAdvanced)
│   │
│   ├── bots/                          // 🤖 BOT MANAGEMENT FEATURE  
│   │   ├── components/
│   │   │   ├── BotTable.jsx           // EXTRACT: bot table logic from BotsAdvanced.jsx
│   │   │   ├── BotRow.jsx             // EXTRACT: individual bot row from ProfessionalBotsTable.jsx
│   │   │   ├── BotActions.jsx         // EXTRACT: bot action buttons from BotsAdvanced.jsx
│   │   │   ├── BotStatusBadge.jsx     // EXTRACT: status display logic
│   │   │   ├── BotPerformanceMetrics.jsx // EXTRACT: individual bot metrics
│   │   │   │
│   │   │   ├── BotControlPanel/       // 🔧 SPLIT MONOLITO (851 líneas → 5 componentes)
│   │   │   │   ├── index.jsx          // Main modal wrapper (100 líneas)
│   │   │   │   ├── BasicConfig.jsx    // Basic bot settings (150 líneas)
│   │   │   │   ├── AdvancedConfig.jsx // Advanced bot settings (200 líneas)
│   │   │   │   ├── RiskManagement.jsx // Risk/TP/SL settings (180 líneas)
│   │   │   │   ├── OrderTypes.jsx     // Order types configuration (150 líneas)
│   │   │   │   └── ValidationSummary.jsx // Final review/validation (70 líneas)
│   │   │   │
│   │   │   ├── BotCreation/           // 🏗️ SPLIT MONOLITO (600+ líneas → 6 componentes)
│   │   │   │   ├── index.jsx          // Main creation modal (100 líneas)
│   │   │   │   ├── BasicForm.jsx      // Basic creation form (150 líneas)
│   │   │   │   ├── AdvancedForm.jsx   // Advanced creation form (150 líneas)
│   │   │   │   ├── StrategySelector.jsx // Strategy selection (120 líneas)
│   │   │   │   ├── TemplateSelector.jsx // MOVE: BotTemplates.jsx (180 líneas)
│   │   │   │   └── ReviewStep.jsx     // Final review step (100 líneas)
│   │   │   │
│   │   │   └── BotMetrics/            // 📈 SPLIT MEGA-MONOLITO (1,444 líneas → 4 componentes)
│   │   │       ├── ScalperMetrics.jsx     // Smart Scalper specific (400 líneas)
│   │   │       ├── AlgorithmMetrics.jsx   // Algorithm performance (350 líneas)
│   │   │       ├── RealTimeMetrics.jsx    // Real-time bot performance (400 líneas)
│   │   │       └── HistoricalMetrics.jsx  // Historical analysis (300 líneas)
│   │   │
│   │   ├── hooks/
│   │   │   ├── useBotOperations.js    // EXTRACT: bot CRUD operations from BotsAdvanced.jsx
│   │   │   ├── useBotState.js         // EXTRACT: bot state management
│   │   │   ├── useBotValidation.js    // EXTRACT: bot form validation logic
│   │   │   ├── useBotMetrics.js       // EXTRACT: bot performance calculations
│   │   │   └── useBotRealTime.js      // EXTRACT: real-time bot updates
│   │   │
│   │   ├── services/
│   │   │   ├── botService.js          // EXTRACT: bot API calls from api.ts
│   │   │   ├── botValidationService.js // NEW: bot validation business logic
│   │   │   └── botMetricsService.js   // EXTRACT: metrics calculations
│   │   │
│   │   ├── contexts/
│   │   │   └── BotManagementContext.jsx // NEW: centralized bot state management
│   │   │
│   │   └── pages/
│   │       └── BotManagementPage.jsx  // REPLACE: BotsAdvanced.jsx (bot management only)
│   │
│   ├── trading/                       // 📈 TRADING OPERATIONS FEATURE
│   │   ├── components/
│   │   │   ├── LiveTradingFeed.jsx    // MOVE: components/LiveTradingFeed.jsx
│   │   │   ├── TradingHistory.jsx     // MOVE: components/TradingHistory.jsx
│   │   │   ├── TradingOperations.jsx  // EXTRACT: trading ops from BotsAdvanced.jsx
│   │   │   ├── SmartTradePanel.jsx    // MOVE: components/SmartTradePanel.tsx
│   │   │   ├── BacktestChart.jsx      // MOVE: components/BacktestChart.jsx
│   │   │   └── OrderExecutionPanel.jsx // NEW: order execution interface
│   │   ├── hooks/
│   │   │   ├── useTradingOperations.js // EXTRACT: trading logic from BotsAdvanced.jsx
│   │   │   ├── useRealTimeTrading.js   // EXTRACT: real-time trading updates
│   │   │   └── useTradingHistory.js    // EXTRACT: trading history management
│   │   ├── services/
│   │   │   ├── tradingOperationsService.js // MOVE: services/tradingOperationsService.js
│   │   │   └── tradingHistoryService.js    // NEW: trading history API calls
│   │   └── pages/
│   │       ├── TradingLivePage.jsx         // EXTRACT: trading live from BotsAdvanced.jsx
│   │       └── TradingHistoryPage.jsx      // CONSOLIDATE: trading history page
│   │
│   ├── navigation/                    // 🧭 NAVIGATION FEATURE
│   │   ├── components/
│   │   │   ├── NavigationTabs.jsx     // EXTRACT: navigation tabs from BotsAdvanced.jsx
│   │   │   ├── Header.jsx             // MOVE: components/Header.jsx
│   │   │   ├── Sidebar.jsx            // MOVE: components/Sidebar.jsx
│   │   │   └── Breadcrumbs.jsx        // NEW: breadcrumb navigation
│   │   ├── contexts/
│   │   │   └── NavigationContext.jsx  // NEW: navigation state management
│   │   └── hooks/
│   │       └── useNavigation.js       // NEW: navigation logic
│   │
│   └── exchanges/                     // 🏛️ EXCHANGE MANAGEMENT FEATURE
│       ├── components/
│       │   ├── AddExchangeModal.jsx   // MOVE: components/exchanges/AddExchangeModal.jsx
│       │   ├── ExchangeCard.jsx       // MOVE: components/exchanges/ExchangeCard.jsx
│       │   └── ExchangeList.jsx       // NEW: exchange management list
│       ├── hooks/
│       │   └── useExchangeOperations.js // NEW: exchange CRUD operations
│       ├── services/
│       │   └── exchangeService.js     // EXTRACT: exchange API calls from api.ts
│       └── pages/
│           └── ExchangeManagement.jsx // MOVE: pages/ExchangeManagement.jsx
│
├── shared/                            // 🔄 SHARED COMPONENTS & UTILITIES
│   ├── components/
│   │   ├── ui/                        // MOVE: components/ui/* (button, card, etc.)
│   │   ├── Layout.jsx                 // MOVE: components/Layout.jsx
│   │   ├── LoadingSpinner.jsx         // NEW: consistent loading component
│   │   └── ErrorBoundary.jsx          // NEW: error handling component
│   │
│   ├── hooks/
│   │   ├── useAuthDL008.js            // MOVE: hooks/useAuthDL008.js
│   │   ├── useRealTimeData.js         // MOVE: hooks/useRealTimeData.js
│   │   ├── useWebSocketRealtime.js    // MOVE: hooks/useWebSocketRealtime.js
│   │   ├── useLocalStorage.js         // NEW: localStorage management
│   │   └── useApiCall.js              // NEW: generic API call hook
│   │
│   ├── services/
│   │   ├── apiClient.js               // REFACTOR: api.ts split by domain
│   │   ├── httpInterceptor.js         // MOVE: services/httpInterceptor.js
│   │   ├── configTemplates.js         // MOVE: services/configTemplates.js
│   │   ├── websocketService.js        // NEW: centralized WebSocket management
│   │   └── notificationService.js     // EXTRACT: notification logic
│   │
│   ├── contexts/
│   │   ├── NotificationContext.jsx    // NEW: global notification state
│   │   └── WebSocketContext.jsx       // NEW: WebSocket connection management
│   │
│   └── utils/
│       ├── botCalculations.js         // MOVE: utils/botCalculations.js
│       ├── formatters.js              // NEW: data formatting utilities
│       ├── validators.js              // NEW: validation utilities
│       └── constants.js               // NEW: application constants
│
├── pages/                             // 🚪 ENTRY POINT PAGES (CLEAN)
│   ├── DashboardPage.jsx             // NEW: dashboard entry point
│   ├── BotManagementPage.jsx         // NEW: bot management entry point
│   ├── TradingPage.jsx               // NEW: trading entry point
│   ├── AuthPage.jsx                  // CONSOLIDATE: auth entry point
│   ├── ExchangePage.jsx              // NEW: exchange management entry point
│   └── (DELETE DUPLICATES)           // REMOVE: Bots.jsx, BotsEnhanced.jsx, Portfolio.jsx (if unused)
│
└── routes/                           // 🛤️ ROUTING CONFIGURATION
    └── App.jsx                       // REFACTOR: routes/App.jsx (cleaner routing)
```

### **📊 COMPONENTE SIZE REDUCTION:**
```bash
# ANTES (Monolítico):
BotsAdvanced.jsx:        1,096 líneas → 
BotControlPanel.jsx:       851 líneas → 
SmartScalperMetrics.jsx: 1,444 líneas →
TOTAL:                   3,391 líneas

# DESPUÉS (Feature-based):
DashboardPage.jsx:         150 líneas ✅
BotManagementPage.jsx:     200 líneas ✅
BotControlPanel/index.jsx: 100 líneas ✅
BasicConfig.jsx:           150 líneas ✅
AdvancedConfig.jsx:        200 líneas ✅
RiskManagement.jsx:        180 líneas ✅
... (20+ componentes especializados)
PROMEDIO:                  150 líneas ✅

RESULTADO: 22+ componentes mantenibles vs 3 monolitos gigantes
```

---

## 📋 **MIGRATION STRATEGY - 6 PHASES INCREMENTAL**

### **⚡ STRANGLER FIG PATTERN:**
*Crear nueva arquitectura alongside existing, migrate gradually sin breaking changes*

#### **PHASE 1: STRUCTURE CREATION (0% Risk) - Week 1**
```bash
# CREAR folders y estructura base
mkdir -p src/features/{auth,dashboard,bots,trading,navigation,exchanges}
mkdir -p src/shared/{components,hooks,services,contexts,utils}

# CREAR componentes vacíos (no usados aún)
touch src/features/dashboard/components/DashboardMetrics.jsx
touch src/features/bots/components/BotTable.jsx
# ... etc

# TESTING: npm run build ✅ (sin errores)
# RESULTADO: Estructura existe, app funciona igual
```

#### **PHASE 2: EXTRACT DASHBOARD (5% Risk) - Week 2**
```javascript
// CREAR: features/dashboard/components/DashboardMetrics.jsx
// EXTRACT: dashboard rendering logic FROM BotsAdvanced.jsx
// REPLACE: Dashboard section IN BotsAdvanced.jsx with <DashboardMetrics />

// BotsAdvanced.jsx ANTES:
const renderDashboardMetrics = () => { /* 200+ líneas */ }

// BotsAdvanced.jsx DESPUÉS:
import DashboardMetrics from '../features/dashboard/components/DashboardMetrics';
return <DashboardMetrics data={metrics} onUpdate={setMetrics} />

// TESTING: Dashboard metrics display identical ✅
// ROLLBACK: git checkout HEAD~1 src/features/dashboard/ ✅
```

#### **PHASE 3: EXTRACT BOT TABLE (10% Risk) - Week 3**
```javascript
// CREAR: features/bots/components/BotTable.jsx
// EXTRACT: bot table logic FROM BotsAdvanced.jsx
// REPLACE: Bot table section with <BotTable />

// TESTING: Bot operations (start/stop/delete/modify) identical ✅
// ROLLBACK: git checkout HEAD~1 src/features/bots/components/ ✅
```

#### **PHASE 4: SPLIT MONOLITHS (15% Risk) - Week 4**
```javascript
// SPLIT: BotControlPanel.jsx → 5 componentes especializados
// SPLIT: SmartScalperMetrics.jsx → 4 componentes especializados
// SPLIT: EnhancedBotCreationModal.jsx → 6 componentes especializados

// TESTING: All modals work identically ✅
// SPECIAL ATTENTION: DL-038 data persistence issue resolution
// ROLLBACK: git checkout HEAD~1 src/features/bots/components/BotControlPanel/ ✅
```

#### **PHASE 5: CONTEXTS & SERVICES (10% Risk) - Week 5**
```javascript
// CREATE: BotManagementContext.jsx
// EXTRACT: State management FROM BotsAdvanced.jsx
// MOVE: API calls to specialized services

// TESTING: State management behavior identical ✅
// PERFORMANCE: Expect improvement due to context optimization
// ROLLBACK: git checkout HEAD~1 src/shared/contexts/ ✅
```

#### **PHASE 6: CLEANUP & OPTIMIZATION (5% Risk) - Week 6**
```javascript
// DELETE: Duplicate pages (Bots.jsx, BotsEnhanced.jsx, Portfolio.jsx if unused)
// REMOVE: Unused components in components/bots/ folder  
// OPTIMIZE: Bundle size with code splitting
// REFACTOR: Clean routing structure

// TESTING: Full system functionality ✅
// PERFORMANCE: Bundle size reduction + faster loading
// ROLLBACK: git revert HEAD~5..HEAD ✅ (revert entire phase 6)
```

---

## 🔒 **NO-BREAKING GUARANTEES**

### **🎯 USER EXPERIENCE PRESERVATION:**
```
✅ IDENTICAL: Visual appearance (0 UI changes)
✅ IDENTICAL: Navigation behavior  
✅ IDENTICAL: Modal interactions
✅ IDENTICAL: Form functionality
✅ IDENTICAL: Real-time updates
✅ IDENTICAL: Authentication flow
✅ IDENTICAL: Bot operations (CRUD)
✅ IDENTICAL: Trading operations
✅ IDENTICAL: Performance metrics display
```

### **🔗 API COMPATIBILITY MATRIX:**
```javascript
// BACKEND APIs - NO CHANGES:
✅ /api/auth/*          (Authentication endpoints)
✅ /api/bots/*          (Bot management endpoints)  
✅ /api/user/exchanges/* (Exchange management endpoints)
✅ /api/trading/*       (Trading operations endpoints)
✅ WebSocket endpoints  (Real-time data)

// FRONTEND API CALLS - SAME LOGIC:
✅ authenticatedFetch() (Same auth pattern DL-008)
✅ Error handling       (Same httpInterceptor logic)
✅ Rate limiting        (Same backend integration)
✅ Token management     (Same AuthContext logic)
```

### **📊 DATA FLOW PRESERVATION:**
```javascript
// MANTENER EXACTO DATA FLOW:
Backend API Response → Frontend Service → Context State → Component Props

// EJEMPLO BOT DATA FLOW:
GET /api/bots → botService.js → BotManagementContext → BotTable.jsx
                                                    → BotControlPanel.jsx
                                                    → BotMetrics.jsx

// RESULTADO: Same data, better organization
```

### **🧪 TESTING STRATEGY:**
```javascript
// TESTING PER PHASE:
Phase 1: npm run build ✅ → No build errors
Phase 2: Dashboard metrics comparison ✅ → Pixel-perfect identical
Phase 3: Bot operations E2E ✅ → All CRUD operations working
Phase 4: Modal functionality ✅ → All forms working identical
Phase 5: State management ✅ → Context state identical
Phase 6: Full system E2E ✅ → Complete user journey working

// AUTOMATED TESTING:
- Component unit tests (isolated testing now possible)
- Integration tests (feature-level testing)  
- E2E tests (full user journey validation)
- Performance tests (bundle size + loading time)
```

### **🔄 ROLLBACK PROCEDURES:**
```bash
# PHASE-LEVEL ROLLBACK:
git checkout HEAD~1 -- src/features/dashboard/    # Rollback Phase 2
git checkout HEAD~1 -- src/features/bots/         # Rollback Phase 3  
git checkout HEAD~1 -- src/features/trading/      # Rollback Phase 4
git commit -m "rollback: Phase X architectural changes"

# COMPLETE ROLLBACK:
git revert HEAD~20..HEAD  # Revert all architectural changes
git commit -m "rollback: Complete architectural refactor"

# BotsAdvanced.jsx PRESERVATION:
# Original BotsAdvanced.jsx remains functional until Phase 6
# Can revert to monolithic structure anytime during migration
```

---

## 🎯 **SUCCESS CRITERIA & VALIDATION**

### **📊 TECHNICAL METRICS:**
```javascript
// CODE QUALITY IMPROVEMENTS:
✅ Component Average Size: 1,100+ líneas → 150 líneas
✅ Cyclomatic Complexity: High → Low (single responsibility)
✅ Test Coverage: 0% → 80%+ (unit testing now possible)
✅ Bundle Size: Reduced (code splitting + lazy loading)
✅ Memory Usage: Improved (smaller components in memory)
```

### **⚡ PERFORMANCE IMPROVEMENTS:**
```javascript
// LOADING PERFORMANCE:
✅ Initial Bundle Size: Reduced (code splitting)
✅ Lazy Loading: Components loaded on demand
✅ Memory Usage: Lower (unused components not in memory)
✅ Re-render Optimization: Isolated context updates
```

### **🛠️ DEVELOPER EXPERIENCE:**
```javascript
// DEVELOPMENT BENEFITS:
✅ Debugging: Isolated component debugging
✅ Testing: Unit tests per component possible
✅ Maintenance: Single responsibility = easier fixes
✅ Team Collaboration: Multiple developers, less conflicts
✅ Feature Development: Add new features without touching existing
```

### **🎯 BUSINESS IMPACT:**
```javascript
// USER EXPERIENCE:
✅ Same Interface: Zero learning curve
✅ Same Functionality: All features preserved
✅ Better Performance: Faster loading times
✅ Fewer Bugs: Isolated components = less breaking changes

// DEVELOPMENT VELOCITY:  
✅ Faster Features: New features don't touch existing code
✅ Easier Maintenance: Bug fixes isolated to specific components
✅ Better Testing: Unit tests prevent regressions
✅ Team Scaling: Multiple developers can work simultaneously
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **PRE-MIGRATION VALIDATION:**
- [ ] All current functionality documented ✅
- [ ] User journey E2E tests created ✅  
- [ ] Performance baseline established ✅
- [ ] Rollback procedures tested ✅

### **PHASE 1 CHECKLIST:**
- [ ] Feature folder structure created
- [ ] Shared components folder organized
- [ ] Build process validates successfully
- [ ] No functional changes confirmed

### **PHASE 2-6 CHECKLISTS:**
- [ ] Component extraction completed  
- [ ] Unit tests for new components
- [ ] Integration tests passing
- [ ] Performance regression check
- [ ] User acceptance validation

### **POST-MIGRATION VALIDATION:**
- [ ] All original functionality preserved
- [ ] Performance improvements measured
- [ ] Code quality metrics improved
- [ ] Team development velocity improved
- [ ] Technical debt reduced significantly

---

*Architectural Specification: 2025-08-28*  
*Migration Strategy: Strangler Fig Pattern*  
*Risk Level: 0-15% per phase with immediate rollback capability*  
*Success Criteria: Same UX + Better Architecture + Improved Performance*