# BUG CRÍTICO: Inversión de base/quote currencies en create_bot

## Ubicación
- Archivo: `routes/bots.py`
- Función: `create_bot`
- Líneas: 787-795

## Problema
El código INVIERTE base_currency y quote_currency:

```python
# ACTUAL (INCORRECTO)
if symbol.endswith("USDT"):
    base_currency = "USDT"      # ❌ WRONG
    quote_currency = symbol[:-4]  # ❌ WRONG
```

## Corrección necesaria
```python
# CORRECTO
if symbol.endswith("USDT"):
    quote_currency = "USDT"       # ✅ CORRECT
    base_currency = symbol[:-4]   # ✅ CORRECT
```

## Impacto
- Para BTCUSDT debería ser: base=BTC, quote=USDT
- Actualmente guarda: base=USDT, quote=BTC (INVERTIDO)
- Afecta función `create_bot` línea 748

## NO afecta a
- Implementación de stake en `run_smart_trade` (línea 618-644) está CORRECTA
- Las extracciones en run_smart_trade están bien implementadas