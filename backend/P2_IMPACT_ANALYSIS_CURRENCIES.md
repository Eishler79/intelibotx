# P2: IMPACT ANALYSIS COMPREHENSIVE - CURRENCIES

## ARCHIVOS AFECTADOS (verificado con grep):

### FRONTEND (11 archivos usan quote_currency, 36 usan base_currency):
1. **EnhancedBotCreationModal.jsx** - CREA bots con convención invertida
2. **BotControlPanel.jsx** - MUESTRA stake con base_currency
3. **useBotCrud.js** - ENVÍA base/quote al backend
4. **BotsContext.jsx** - MANEJA estado global de bots
5. **BotConfigForm.jsx** - EDITA configuración de bots
6. **FinancialConfig.jsx** - CONFIGURA parámetros financieros
7. **ConfigurationSummary.jsx** - MUESTRA resumen configuración

### BACKEND:
1. **routes/bots.py**:
   - `create_bot` (línea 748) - USA convención invertida
   - `run_smart_trade` (línea 548) - MI CÓDIGO usa convención técnica
   - `get_bots` (línea 627) - LEE bots de BD
   - `update_bot` (línea 963) - ACTUALIZA bots

2. **models/bot_config.py**:
   - Define base_currency como "Moneda base para capital"
   - Define quote_currency como "Moneda de beneficio"

3. **BASE DE DATOS**:
   - 2 bots existentes con convención invertida
   - Migraciones podrían romper sistema

## IMPACTO SI CORRIJO TODO:

### Opción A: Corregir a convención técnica estándar
**Archivos a modificar:** 43+ archivos
**Riesgo:** CRÍTICO
- ❌ Rompe TODOS los bots existentes
- ❌ Rompe UI que muestra stake
- ❌ Requiere migración BD
- ❌ Puede romper lógica de trading

### Opción B: Mantener convención del sistema
**Archivos a modificar:** 1 archivo (mi código en run_smart_trade)
**Riesgo:** MÍNIMO
- ✅ No rompe nada existente
- ✅ Mantiene compatibilidad total
- ✅ Un solo cambio localizado
- ✅ Sistema sigue funcionando

## BACKWARDS COMPATIBILITY:

Si corrijo TODO:
- Bots creados antes: NO FUNCIONARÁN
- UI actual: MOSTRARÁ MAL EL STAKE
- APIs existentes: ROMPERÁN

Si adapto mi código:
- Todo sigue funcionando exactamente igual
- Solo mi función se adapta a la convención

## DEPENDENCIAS OCULTAS ENCONTRADAS:

1. **ProfessionalBotsTable.jsx** probablemente usa base_currency
2. **Trading engine** puede depender de esta convención
3. **Reportes y métricas** pueden usar base_currency
4. **Webhooks y notificaciones** pueden enviar base_currency

## DECISIÓN BASADA EN HECHOS:

**ADAPTAR MI CÓDIGO A LA CONVENCIÓN DEL SISTEMA**

Razón: El sistema COMPLETO usa consistentemente la convención invertida.
No es un bug, es una decisión de diseño (aunque técnicamente incorrecta).

Cambiar TODO sería:
- Alto riesgo
- Mucho trabajo
- Potencialmente destructivo
- Sin beneficio real para el usuario