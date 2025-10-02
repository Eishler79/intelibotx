-- ================================================================================
-- SCRIPT SQL: AGREGAR COLUMNAS WYCKOFF A BOTCONFIG
-- DL-113: Implementación Wyckoff
-- Fecha: 2025-01-26
-- Base de datos: SQLite (desarrollo)
-- Total columnas: 27 (según modelo bot_config.py líneas 80-106)
-- ================================================================================

-- COLUMNAS WYCKOFF SEGÚN MODELO bot_config.py
ALTER TABLE botconfig ADD COLUMN wyckoff_vol_increase_factor REAL DEFAULT 1.5;
ALTER TABLE botconfig ADD COLUMN wyckoff_atr_factor REAL DEFAULT 0.5;
ALTER TABLE botconfig ADD COLUMN wyckoff_support_touches_min INTEGER DEFAULT 2;
ALTER TABLE botconfig ADD COLUMN wyckoff_resistance_touches_min INTEGER DEFAULT 2;
ALTER TABLE botconfig ADD COLUMN wyckoff_rebound_threshold REAL DEFAULT 0.02;
ALTER TABLE botconfig ADD COLUMN wyckoff_rejection_threshold REAL DEFAULT 0.02;
ALTER TABLE botconfig ADD COLUMN wyckoff_vol_climax_factor REAL DEFAULT 2.0;
ALTER TABLE botconfig ADD COLUMN wyckoff_wick_size_min REAL DEFAULT 1.5;
ALTER TABLE botconfig ADD COLUMN wyckoff_ar_rebound_pct REAL DEFAULT 0.03;
ALTER TABLE botconfig ADD COLUMN wyckoff_ar_decline_pct REAL DEFAULT 0.03;
ALTER TABLE botconfig ADD COLUMN wyckoff_near_threshold REAL DEFAULT 0.01;
ALTER TABLE botconfig ADD COLUMN wyckoff_vol_reduced_factor REAL DEFAULT 0.5;
ALTER TABLE botconfig ADD COLUMN wyckoff_test_atr_factor REAL DEFAULT 0.3;
ALTER TABLE botconfig ADD COLUMN wyckoff_strong_close_factor REAL DEFAULT 0.5;
ALTER TABLE botconfig ADD COLUMN wyckoff_weak_close_factor REAL DEFAULT 0.5;
ALTER TABLE botconfig ADD COLUMN wyckoff_breakout_threshold REAL DEFAULT 0.01;
ALTER TABLE botconfig ADD COLUMN wyckoff_breakdown_threshold REAL DEFAULT 0.01;
ALTER TABLE botconfig ADD COLUMN wyckoff_vol_surge_factor REAL DEFAULT 1.8;
ALTER TABLE botconfig ADD COLUMN wyckoff_resistance_clear_factor REAL DEFAULT 0.5;
ALTER TABLE botconfig ADD COLUMN wyckoff_support_broken_factor REAL DEFAULT 0.5;
ALTER TABLE botconfig ADD COLUMN wyckoff_pullback_threshold REAL DEFAULT 0.02;
ALTER TABLE botconfig ADD COLUMN wyckoff_vol_dry_factor REAL DEFAULT 0.3;
ALTER TABLE botconfig ADD COLUMN wyckoff_support_tolerance REAL DEFAULT 0.2;
ALTER TABLE botconfig ADD COLUMN wyckoff_resistance_tolerance REAL DEFAULT 0.2;
ALTER TABLE botconfig ADD COLUMN wyckoff_jump_threshold REAL DEFAULT 0.02;
ALTER TABLE botconfig ADD COLUMN wyckoff_vol_expansion_factor REAL DEFAULT 1.5;
ALTER TABLE botconfig ADD COLUMN wyckoff_momentum_factor REAL DEFAULT 0.5;

-- ================================================================================
-- TOTAL: 27 COLUMNAS (según modelo actual)
-- ================================================================================
-- Para ejecutar en SQLite:
-- sqlite3 bot_data.db < add_wyckoff_columns.sql
-- ================================================================================