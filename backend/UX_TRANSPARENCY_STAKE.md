# UX TRANSPARENCY REQUIREMENTS - PARÁMETRO `stake`

## 📊 CAMBIOS VISIBLES PARA EL USUARIO

### ✅ **SIN CAMBIOS VISIBLES EN:**

1. **Pantalla de creación de bot**
   - Usuario sigue configurando `stake` en USDT (sin cambios)
   - Ejemplo: Usuario ingresa 500 USDT

2. **Tabla de bots (ProfessionalBotsTable.jsx)**
   - Sigue mostrando stake configurado (sin cambios)
   - Columna "Capital" muestra: 500 USDT

3. **Panel de control (BotControlPanel.jsx)**
   - Campo stake sigue editable (sin cambios)
   - Usuario puede modificar stake: 500 → 1000 USDT

4. **Métricas del bot**
   - PnL sigue calculándose sobre stake (sin cambios)
   - ROI% = (ganancia / stake) * 100

### ⚠️ **CAMBIOS INTERNOS (NO VISIBLES):**

1. **API Call (useSmartScalperAPI.js:139)**
   - ANTES: `quantity=0.001` hardcoded
   - DESPUÉS: No envía quantity (backend calcula)

2. **Backend Calculation**
   - ANTES: Usa quantity del frontend (0.001)
   - DESPUÉS: Calcula: quantity = stake / current_price

3. **Orden en Exchange**
   - ANTES: Compra 0.001 BTC (fijo)
   - DESPUÉS: Compra cantidad correcta basada en stake

### 📝 **MENSAJES AL USUARIO:**

**No se requieren nuevos mensajes porque:**
- El usuario YA configura stake
- El cambio es una corrección interna
- No hay nueva funcionalidad visible

### 🔍 **VALIDACIONES UX:**

| Elemento | Estado Actual | Estado Después | Cambio Visible |
|----------|--------------|----------------|----------------|
| Input Stake | 500 USDT | 500 USDT | ❌ No |
| Display Stake | "Capital: 500" | "Capital: 500" | ❌ No |
| Ejecución Trade | 0.001 BTC | 0.005 BTC | ⚠️ Solo en logs |
| Notificaciones | Sin cambios | Sin cambios | ❌ No |
| Confirmaciones | Sin cambios | Sin cambios | ❌ No |

### 🎯 **BENEFICIO PARA EL USUARIO:**

**TRANSPARENTE:** El usuario no notará el cambio, pero sus trades usarán el capital correcto que configuró.

- **Configuró:** 500 USDT
- **Antes ejecutaba:** ~100 USDT (bug)
- **Ahora ejecutará:** 500 USDT (correcto)

### ⚡ **CASOS EDGE UX:**

1. **Si stake > balance disponible:**
   - Mostrar: "Saldo insuficiente para stake de 500 USDT"

2. **Si cálculo da quantity < min_order_size:**
   - Mostrar: "Stake muy bajo para este par. Mínimo: X USDT"

3. **Si precio cambia drásticamente:**
   - Recalcular antes de ejecutar
   - No mostrar quantity al usuario (solo stake)

## CONCLUSIÓN

✅ **CAMBIO 100% TRANSPARENTE**
- Usuario sigue viendo/configurando STAKE en USDT
- Backend ahora respeta ese valor correctamente
- Sin popups, sin confirmaciones adicionales, sin cambios visuales