# P1: DIAGNOSTIC WITH TOOL VERIFICATION - CURRENCIES

## HECHOS VERIFICADOS CON HERRAMIENTAS:

### 1. BASE DE DATOS (sqlite3 intelibotx.db)
```
Bot 1: BTCUSDT | base=USDT | quote=BTC | stake=100
Bot 2: SOLUSDT | base=USDT | quote=SOL | stake=100
```

### 2. FRONTEND - EnhancedBotCreationModal.jsx (línea 628-629)
```javascript
base_currency: quote, // USDT va aquí
quote_currency: base  // BTC va aquí
```
**INVERSIÓN INTENCIONAL**: Guarda USDT como base_currency

### 3. BACKEND - routes/bots.py create_bot (línea 787-789)
```python
if symbol.endswith("USDT"):
    base_currency = "USDT"      # USDT va aquí
    quote_currency = symbol[:-4] # BTC va aquí
```
**INVERSIÓN INTENCIONAL**: Guarda USDT como base_currency

### 4. FRONTEND - BotControlPanel.jsx (línea 618)
```javascript
${(bot?.stake || 0).toLocaleString()} {parameters.base_currency}
```
**USA base_currency COMO MONEDA DEL STAKE**

### 5. MI CÓDIGO - routes/bots.py run_smart_trade (línea 623-625)
```python
if normalized_symbol.endswith("USDT"):
    quote_currency = "USDT"      # USDT va aquí (TÉCNICAMENTE CORRECTO)
    base_currency = symbol[:-4]  # BTC va aquí (TÉCNICAMENTE CORRECTO)
```
**MI CÓDIGO SIGUE CONVENCIÓN TÉCNICA ESTÁNDAR**

## DESCUBRIMIENTO CRÍTICO:

TODO EL SISTEMA USA UNA CONVENCIÓN INVERTIDA PERO CONSISTENTE:
- Frontend: base_currency = moneda del stake (USDT)
- Backend: base_currency = moneda del stake (USDT)
- BD: base_currency = moneda del stake (USDT)
- UI: Muestra stake con base_currency

La inversión NO es un error, es una CONVENCIÓN DEL SISTEMA.

## PROBLEMA:
Mi código en run_smart_trade sigue la convención técnica estándar, NO la convención del sistema.