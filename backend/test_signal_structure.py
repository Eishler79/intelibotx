#!/usr/bin/env python3
"""
Test para verificar la estructura de señales Wyckoff
"""

# Simular lo que retorna una función de detección
accumulation_signals = {
    'ps': {
        'detected': True,
        'price_level': 100,
        'confidence': 0.7
    },
    'sc': {
        'detected': False,
        'price_level': 0.0,
        'confidence': 0.0
    },
    'ar': {
        'detected': True,
        'price_level': 105,
        'confidence': 0.8
    }
}

# Combinar señales como en el código actual (líneas 334-338)
wyckoff_signals = {}
wyckoff_signals.update(accumulation_signals)

print("Estructura de wyckoff_signals:")
print(wyckoff_signals)
print()

# Probar el código actual (línea 343)
print("Prueba del código ACTUAL (línea 343):")
detected_signals = sum(1 for s in wyckoff_signals.values() if s.get('detected', False))
print(f"Señales detectadas: {detected_signals}")
print()

# Lo que DEBERÍA ser
print("Verificación manual:")
for signal_name, signal_data in wyckoff_signals.items():
    print(f"  {signal_name}: detected={signal_data.get('detected', False)}")

print()
print("CONCLUSIÓN: El código ACTUAL está correcto!")
print("wyckoff_signals.values() retorna los diccionarios internos")
print("Cada s es un dict con 'detected', 'price_level', 'confidence'")