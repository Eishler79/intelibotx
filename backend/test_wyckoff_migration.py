#!/usr/bin/env python3
"""
Test de Validación Migración Wyckoff - DL-113
Verifica que las 30 columnas Wyckoff existan en la BD
"""

import sqlite3
import sys
from pathlib import Path
from datetime import datetime

def test_wyckoff_columns():
    """Valida las 30 columnas Wyckoff en SQLite"""

    print("=" * 80)
    print("🔍 TEST MIGRACIÓN WYCKOFF DL-113")
    print("=" * 80)

    # 1. Conectar a la base de datos
    db_path = Path("intelibotx.db")

    if not db_path.exists():
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print(f"\n✅ Conectado a base de datos: {db_path}")

    # 2. Definir las 30 columnas esperadas con sus valores default
    expected_columns = {
        # GAP #1: Spring/UTAD Detection (6)
        'wyckoff_vol_increase_factor': 1.5,
        'wyckoff_atr_factor': 0.5,
        'wyckoff_support_touches_min': 3,
        'wyckoff_resistance_touches_min': 3,
        'wyckoff_rebound_threshold': 0.01,
        'wyckoff_rejection_threshold': 0.01,

        # GAP #2: Accumulation Phase (8)
        'wyckoff_vol_climax_factor': 2.0,
        'wyckoff_wick_size_min': 0.5,
        'wyckoff_ar_rebound_pct': 0.5,
        'wyckoff_ar_decline_pct': 0.3,
        'wyckoff_near_threshold': 0.02,
        'wyckoff_vol_reduced_factor': 0.7,
        'wyckoff_test_atr_factor': 0.3,
        'wyckoff_strong_close_factor': 0.7,

        # GAP #3: Markup Phase (6)
        'wyckoff_weak_close_factor': 0.3,
        'wyckoff_breakout_threshold': 0.02,
        'wyckoff_vol_surge_factor': 1.8,
        'wyckoff_resistance_clear_factor': 1.01,
        'wyckoff_pullback_threshold': 0.02,
        'wyckoff_vol_dry_factor': 0.3,

        # GAP #3: Distribution Phase (4)
        'wyckoff_breakdown_threshold': 0.02,
        'wyckoff_support_broken_factor': 0.99,
        'wyckoff_support_tolerance': 0.2,
        'wyckoff_resistance_tolerance': 0.2,

        # GAP #3: Markdown Phase (3)
        'wyckoff_jump_threshold': 0.02,
        'wyckoff_vol_expansion_factor': 1.5,
        'wyckoff_momentum_factor': 0.5
    }

    print(f"\n📋 Columnas esperadas: {len(expected_columns)}")

    # 3. Obtener columnas actuales de la tabla
    cursor.execute("PRAGMA table_info(botconfig);")
    columns_info = cursor.fetchall()

    existing_columns = {col[1]: col for col in columns_info}
    wyckoff_columns = {name: info for name, info in existing_columns.items()
                       if name.startswith('wyckoff_')}

    print(f"📊 Columnas Wyckoff encontradas: {len(wyckoff_columns)}")

    # 4. Verificar cada columna esperada
    missing_columns = []
    found_columns = []

    print("\n🔍 VERIFICACIÓN DETALLADA:")
    print("-" * 80)

    for col_name, default_value in expected_columns.items():
        if col_name in existing_columns:
            found_columns.append(col_name)
            print(f"✅ {col_name}: EXISTE")
        else:
            missing_columns.append(col_name)
            print(f"❌ {col_name}: FALTA (default: {default_value})")

    # 5. Resumen
    print("\n" + "=" * 80)
    print("📊 RESUMEN DE VALIDACIÓN")
    print("=" * 80)

    print(f"\n✅ Columnas encontradas: {len(found_columns)}/{len(expected_columns)}")
    print(f"❌ Columnas faltantes: {len(missing_columns)}/{len(expected_columns)}")

    if missing_columns:
        print(f"\n⚠️ MIGRACIÓN REQUERIDA - Faltan {len(missing_columns)} columnas:")
        for col in missing_columns[:5]:  # Mostrar primeras 5
            print(f"   - {col}")
        if len(missing_columns) > 5:
            print(f"   ... y {len(missing_columns) - 5} más")

        print(f"\n📝 INSTRUCCIONES:")
        print("1. Ejecutar script de migración:")
        print("   sqlite3 bot_data.db < migrations/add_wyckoff_columns.sql")
        print("2. Volver a ejecutar este test para validar")

        success = False
    else:
        print("\n✅ TODAS LAS COLUMNAS WYCKOFF ESTÁN PRESENTES")

        # 6. Verificar que se pueden usar las columnas
        try:
            cursor.execute("""
                SELECT
                    wyckoff_vol_increase_factor,
                    wyckoff_atr_factor,
                    wyckoff_support_touches_min
                FROM botconfig
                LIMIT 1
            """)
            result = cursor.fetchone()

            if result:
                print(f"\n✅ Columnas accesibles correctamente")
                print(f"   - wyckoff_vol_increase_factor: {result[0]}")
                print(f"   - wyckoff_atr_factor: {result[1]}")
                print(f"   - wyckoff_support_touches_min: {result[2]}")
            else:
                print(f"\nℹ️ No hay registros en botconfig para validar valores")

            success = True

        except sqlite3.OperationalError as e:
            print(f"\n❌ Error al acceder columnas: {e}")
            success = False

    # 7. Test de escritura (opcional)
    if success and found_columns:
        print("\n🔍 TEST DE ESCRITURA:")
        try:
            # Intentar actualizar una columna Wyckoff
            cursor.execute("""
                UPDATE botconfig
                SET wyckoff_vol_increase_factor = 1.5
                WHERE id = (SELECT id FROM botconfig LIMIT 1)
            """)
            print("✅ Escritura exitosa en columnas Wyckoff")
            conn.rollback()  # No guardar cambios de prueba
        except Exception as e:
            print(f"❌ Error en escritura: {e}")
            success = False

    conn.close()

    # 8. Resultado final
    print("\n" + "=" * 80)
    if success:
        print("✅ MIGRACIÓN WYCKOFF VALIDADA CORRECTAMENTE")
    else:
        print("❌ MIGRACIÓN WYCKOFF PENDIENTE O CON ERRORES")
    print("=" * 80)

    return success

def apply_migration():
    """Aplica la migración SQL automáticamente"""
    import subprocess

    print("\n🔄 APLICANDO MIGRACIÓN...")

    migration_file = Path("add_wyckoff_columns.sql")
    db_file = Path("intelibotx.db")

    if not migration_file.exists():
        print(f"❌ Archivo de migración no encontrado: {migration_file}")
        return False

    try:
        # Ejecutar migración con sqlite3
        result = subprocess.run(
            f"sqlite3 {db_file} < {migration_file}",
            shell=True,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            print("✅ Migración aplicada exitosamente")
            return True
        else:
            print(f"❌ Error en migración: {result.stderr}")
            return False

    except Exception as e:
        print(f"❌ Error ejecutando migración: {e}")
        return False

if __name__ == "__main__":
    # Test inicial
    success = test_wyckoff_columns()

    # Si faltan columnas, preguntar si aplicar migración
    if not success:
        response = input("\n¿Desea aplicar la migración automáticamente? (s/n): ")
        if response.lower() == 's':
            if apply_migration():
                print("\n🔄 Revalidando después de migración...")
                test_wyckoff_columns()