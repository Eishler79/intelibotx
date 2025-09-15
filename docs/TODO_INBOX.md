# TODO_INBOX.md · Pendientes sin depurar

> **Regla:** Aquí NO se ejecuta nada.  
> Solo se trasladan a `BACKLOG.md` si hay contexto + `SPEC_REF`.

---

## 🔄 **ITEMS PENDIENTES:**


### **DL-089B: CHART IMPROVEMENTS & REAL-TIME INTEGRATION**

**CHART ENHANCEMENTS REQUIRED:**
1. **Real-Time Price Display:**
   - **Current:** $43,125.05 from simulated data (InstitutionalChart.jsx:163)
   - **Required:** Real exchange API integration with live price updates
   - **Implementation:** Connect to bot.market_type (SPOT/FUTURES) specific pricing
   - **Counter:** Live updating counter similar to balance display shown in user image

2. **Timeframe Controls Missing:**
   - **Current:** Fixed 15m interval with no user controls
   - **Required:** Interactive timeframe selector (1m, 5m, 15m, 1h, 4h, 1d)
   - **Location:** Chart header area next to symbol display
   - **Integration:** Update both API calls and chart data when timeframe changes

3. **Percentage Display Accuracy:**
   - **Current:** -4.00% from fake priceChange calculation (InstitutionalChart.jsx:145-146) 
   - **Required:** Real percentage based on actual market movement
   - **Source:** Exchange API based on selected timeframe and market type

4. **Chart Legends & Tooltips:**
   - **Current:** Basic tooltips with institutional indicators
   - **Required:** Enhanced tooltips showing algorithm trigger conditions
   - **Details:** When hovering over algorithm points, show WHY that algorithm triggered

**MARKET TYPE INTEGRATION:**
- **SPOT vs FUTURES differentiation:** Price source must match bot.market_type
- **Exchange-specific pricing:** Binance API integration for real market data
- **Update frequency:** 5-6 second updates matching user's balance component pattern

---

### **DL-089C: UX LAYOUT REORGANIZATION**

**LAYOUT RESTRUCTURING - PRESERVE DESIGN STYLING:**
1. **Multi-Algorithm Consensus FIRST:**
   - **Current Location:** Lines 409-432 (AFTER individual algorithms)
   - **New Location:** Move to position 2 (after chart, before individual algorithms)
   - **Reason:** Consensus should inform user BEFORE showing individual details

2. **Algorithm Display Order:**
   - **Current:** 8 individual algorithms → Multi-Algorithm Consensus
   - **Required:** Chart → Multi-Algorithm Consensus → 8 individual algorithms → Analysis sections
   - **Grid Alignment:** Maintain current responsive grid, NO design changes

3. **Consensus Criteria Transparency:**
   - **Current:** "6/8 Bullish" without explanation
   - **Required:** Show WHICH 6 algorithms are bullish and WHY
   - **Display:** Expandable detail showing algorithm scores and threshold logic

4. **Signal Strength Analysis:**
   - **Current:** Separate Signal Strength card (lines 633-713)
   - **Evaluation:** Determine if redundant with Institutional Algorithm Analysis
   - **Decision:** Keep if shows different metrics, merge if duplicate information

**ALIGNMENT REQUIREMENTS:**
- **NO design changes:** Preserve current card styling and colors
- **Grid consistency:** Maintain responsive xl:grid-cols-3 lg:grid-cols-2 structure
- **Spacing preservation:** Keep current gap-4 lg:gap-6 spacing

---

### **DL-089D: LIVE DATA REFRESH & COUNTER IMPLEMENTATION**

**REAL-TIME DATA FLOW:**
1. **15-Second Refresh Fix:**
   - **Current Issue:** useEffect dependency [bot, authenticatedFetch] doesn't trigger intervals
   - **Solution:** Add state trigger for interval-based updates
   - **Pattern:** Similar to balance component counter shown in user image

2. **Price Counter Implementation:**
   - **Location:** Chart header, centered position
   - **Format:** Large price display with real-time updates
   - **Animation:** Smooth transitions on price changes (green/red flash)

3. **Data Source Validation:**
   - **Current:** Mixed fake/real data causing confusion
   - **Required:** 100% real data from useSmartScalperAPI hooks
   - **Indicators:** Clear data source indicators (Live/Cached/Approximate)

**INTEGRATION CHECKLIST:**
- Replace ALL Math.random() with real API data
- Connect specialized hooks to production component  
- Implement proper error handling for API failures
- Add loading states for data transitions

**SPEC_REF:** SmartScalperMetricsComplete.jsx:409-432 + InstitutionalChart.jsx:145-146,163 + User balance counter pattern + DL-089A integration requirements

---