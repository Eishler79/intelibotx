# BACKLOG.md - Current Action Plan & Priorities  
> **PURPOSE:** Task management and priority queue - pending items only

---

## 🔥 **PRIORITY 1: POST DL-088 PENDING TASKS**

### **Chart Responsive Layout Optimization - ALTA**
**SCOPE:** Fix InstitutionalChart height issues (vertical cut-off in modal)
**TIMELINE:** Immediate (visual UX critical)
**DEPENDENCIES:** DL-088 merge completed

### **Performance Metrics Data Integration - ALTA**  
**SCOPE:** Connect real bot performance data to SmartScalperPerformanceView
**TIMELINE:** 1-2 days
**DEPENDENCIES:** Chart responsive layout fixed

### **Auto-Responsive Grid Layout Enhancement - MEDIA**
**SCOPE:** Full auto-responsive behavior across all screen sizes
**TIMELINE:** 2-3 days  
**DEPENDENCIES:** Performance metrics integration

### **ENCRYPTION_MASTER_KEY Railway Config - CRÍTICA**
**SCOPE:** Railway environment variable implementation for API key encryption
**TIMELINE:** Ready to implement
**DEPENDENCIES:** AuthContext refactored (completed)

### **Frontend Exchange Loading UX - CRÍTICA**
**SCOPE:** Auto-refresh + UX improvement for exchange recognition
**TIMELINE:** Ready to implement
**ISSUE:** Exchange requires manual reload for recognition

---

## 🔥 **PRIORITY 2: ALGORITMOS INSTITUCIONALES PENDIENTES**

### **VSA (Volume Spread Analysis) - ALTA**
**SCOPE:** Implement institutional volume analysis algorithm
**TIMELINE:** 2-3 weeks
**DEPENDENCIES:** DL-088 testing completed

### **SMC (Smart Money Concepts) - ALTA**
**SCOPE:** Market structure and order flow analysis
**TIMELINE:** 2-3 weeks
**DEPENDENCIES:** VSA implementation

### **Market Profile Analysis - ALTA** 
**SCOPE:** Volume-based market structure analysis
**TIMELINE:** 3-4 weeks
**DEPENDENCIES:** SMC completion

### **Institutional Order Flow - ALTA**
**SCOPE:** Large order detection and analysis
**TIMELINE:** 3-4 weeks
**DEPENDENCIES:** Market Profile implementation

### **Accumulation/Distribution Analysis - MEDIA**
**SCOPE:** Smart money accumulation patterns
**TIMELINE:** 2-3 weeks
**DEPENDENCIES:** Order Flow completion

### **Composite Man Theory Implementation - MEDIA**
**SCOPE:** Market manipulation detection algorithm
**TIMELINE:** 4-5 weeks
**DEPENDENCIES:** A/D analysis completion

---

## 🔥 **PRIORITY 3: MODOS OPERATIVOS PENDIENTES**

### **Trend Following Mode - ALTA**
**SCOPE:** SMC + Market Profile + VSA integration
**TIMELINE:** 3-4 weeks
**DEPENDENCIES:** Core algorithms completion

### **Anti-Manipulation Mode - ALTA**
**SCOPE:** Composite Man + Order Flow integration
**TIMELINE:** 4-5 weeks
**DEPENDENCIES:** Institutional algorithms complete

### **News Sentiment Mode - MEDIA**
**SCOPE:** Central Bank + Options Flow analysis
**TIMELINE:** 6-8 weeks
**DEPENDENCIES:** Anti-Manipulation mode completion

### **Volatility Adaptive Mode - MEDIA**
**SCOPE:** VSA + Market Profile adaptive integration
**TIMELINE:** 3-4 weeks
**DEPENDENCIES:** News Sentiment mode

---

## 🔥 **PRIORITY 4: TECHNICAL DEBT & OPTIMIZATION**

### **WebSocket Performance Optimization**
**SCOPE:** <50ms latency verification for institutional algorithms
**TIMELINE:** 3-4 days
**DEPENDENCIES:** Ready to implement

### **Testing Suite Implementation**  
**SCOPE:** E2E validation + regression prevention
**TIMELINE:** 2-3 days
**DEPENDENCIES:** WebSocket optimization

### **Bundle Size Optimization**
**SCOPE:** Code splitting + lazy loading implementation
**TIMELINE:** 1-2 weeks
**DEPENDENCIES:** Testing suite implementation

### **Naming Collision Cleanup**
**SCOPE:** 4 archivos useTradingOperations duplicados (código muerto)
**TIMELINE:** 1 day
**DEPENDENCIES:** Bundle optimization

---

## 🔥 **PRIORITY 5: ML & AUTOMATION PENDIENTES**

### **ML Mode Selection System**
**SCOPE:** AI-driven bot adaptation system
**TIMELINE:** 8-12 weeks
**DEPENDENCIES:** All 12 institutional algorithms + 5 operational modes

### **Continuous Learning System**
**SCOPE:** Bot learns from each trade for evolution
**TIMELINE:** 6-8 weeks
**DEPENDENCIES:** ML Mode Selection system

### **Performance Optimization Engine**
**SCOPE:** Auto-optimization based on market conditions
**TIMELINE:** 4-6 weeks
**DEPENDENCIES:** Continuous Learning system

---

*Updated: 2025-09-13*  
*Purpose: Task management only - no project status*  
*Project status → MASTER_PLAN.md*  
*DL decisions → DECISION_LOG.md*