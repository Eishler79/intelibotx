# MIGRATIONS.md · Registro de Migraciones Base de Datos

> **Regla GUARDRAILS:** Toda migración de schema DB debe estar registrada aquí con SPEC_REF

---

## 2025-08-19 — M-001 · PostgreSQL Migration Base

**Contexto:** Migración base SQLite → PostgreSQL ya completada en DL-005  
**Schema Changes:** Ninguno - Solo cambio de DATABASE_URL  
**Impacto:** Persistencia robusta habilitada  
**Rollback:** Revertir DATABASE_URL a SQLite  
**SPEC_REF:** DECISION_LOG.md#DL-005

---

## Estado Actual del Schema

### **Tablas Existentes:**
- `user` - Usuarios del sistema con email verification
- `usersession` - Sesiones JWT activas  
- `botconfig` - Configuración de bots de trading
- `userexchange` - Exchanges configurados por usuario
- `tradingorder` - Órdenes de trading (si tabla existe)

### **Modelo de Datos:**
- **Todas las tablas utilizan SQLModel** (Pydantic + SQLAlchemy)
- **Foreign Keys:** user_id references en todas las tablas secundarias
- **Constraints:** Email unique, API keys encrypted

---

## Próximas Migraciones Planificadas

Ninguna planificada - Schema estable para producción