# InteliBotX · Reglas Base (MEMORIA)

## 1. Premisas inmutables
1. Validar **conmigo** antes de realizar cambios estructurales.
2. No romper código funcional innecesariamente.
3. Nada hardcodeado ni simulado: solo datos, APIs o DB reales.
4. Consultar y **citar** los `.MD` estratégicos antes de implementar cambios.

## 2. Flujo obligatorio por turno
1. Leer `GUARDRAILS.md` y `CLAUDE_INDEX.md`.
2. Si falta contexto, **pedir el `.MD` o archivo exacto** (no inventar ni asumir).
3. Proponer **PLAN DE CAMBIOS** detallado:
   - Archivos a tocar.
   - Riesgos detectados.
   - Plan de rollback.
   - `SPEC_REF` correspondiente.
4. Esperar confirmación antes de ejecutar.
5. Aplicar cambios → mostrar **DIFF** → indicar **cómo probar**.
6. Si algo rompe, ejecutar **ROLLBACK inmediato**.

## 3. Persistencia y autenticación
- Backend **FastAPI** con base de datos real.
- Métricas y datos solo desde la DB (nada temporal).
- Autenticación JWT en **todas** las rutas.
- Sin credenciales en el código.

## 4. Reglas dinámicas de sesión (plan vivo)
- Cargar en memoria:  
  - `CLAUDE.md` (master entry point)
  - `CLAUDE_BASE.md`
  - `GUARDRAILS.md`
  - `MASTER_PLAN.md`
- Priorizar leyendo `BACKLOG.md` y las últimas 3 entradas de `DECISION_LOG.md` cuando se solicite.
- Cuando surja un nuevo ítem:
  - Primero a `TODO_INBOX.md` (no ejecutar aún).
  - Solo se promueve a "Tareas activas" tras mi confirmación.
- Al cerrar una tarea:
  - Mover a "Hecho hoy".
  - Si cambió el criterio, agregar entrada a `DECISION_LOG.md`.
  - Usar `SPEC_REF` en código y en el commit.
- Cierre del día:
  - Pendientes → `BACKLOG.md`.
  - Clasificar "Descubrimientos" para futura referencia.
  - Actualizar `SESSION_CLOSURE_YYYY-MM-DD.md`
  - Para commitear, usa spec_commit.py

## 5. Actualizado 2025-08-27 - DL-038 Session
- **Proceso:** Diagnostic session bot data persistence completado
- **Status:** Root cause process identificado, ready for targeted fix
- **Next Priority:** Implement DL-038 specific fix for data corruption process
- **Documentation:** SESSION_CLOSURE_2025-08-27.md created, BACKLOG.md updated