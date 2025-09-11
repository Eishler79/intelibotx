# TODO_INBOX.md · Pendientes sin depurar

> **Regla:** Aquí NO se ejecuta nada.  
> Solo se trasladan a `BACKLOG.md` si hay contexto + `SPEC_REF`.

---

## 🔄 **ITEMS PENDIENTES:**

- **min_volume field conversion logic error** - Backend convierte min_volume=0 a None incorrectamente. Frontend envía 0, backend should save 0 not null. Lógica conversión en routes/bots.py línea 586-587 excluye 0 pero 0 es valor válido para min_volume. BotControlPanel muestra barras sin datos porque min_volume=null. *(origen: Usuario 2025-09-11 - análisis logs creación bot BNB)*
- **Trades per day calculation logic analysis** - calculate_estimated_trades() función backend usa base_trades por estrategia * cooldown_factor, requiere análisis profundo de lógica y parámetros *(origen: Usuario 2025-09-10 - quiere entender cálculo completo)*
- **Bot table actions functionality review** - Revisión completa acciones tabla bots: 1) Activar/Start, 2) Visualizar Indicadores Avanzados, 3) Historial de Trading, 4) Estados bot (Paused/Active/Stopped) - verificar funcionalidad y UX *(origen: Usuario 2025-09-10 - requerimiento funcionalidad completa)*
- **Live trading bot panel analysis** - Análisis del panel de bot en la sección Trading en Vivo, verificar cómo está funcionando este componente, su integración con datos real-time y funcionalidades operativas *(origen: Usuario 2025-09-11 - revisar componente trading en vivo)*
- **Bot last_trade_at field relocation analysis** - Analizar campo last_trade_at que aparece null en creación de bot, determinar si debe moverse a sección historial/métricas o operaciones de trading ya que no corresponde a configuración de bot *(origen: Usuario 2025-09-11 - análisis campos null creación bot)*

---