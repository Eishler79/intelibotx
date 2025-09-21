# DATABASE_OPTIMIZATION_PRODUCTION.md - Configuraciones Críticas PostgreSQL PRD

> **PROPÓSITO:** Configuraciones específicas para PostgreSQL Production que eviten problemas de saturación identificados en desarrollo SQLite
> **CREADO:** 2025-09-19
> **CONTEXTO:** Solución DL-100 timeframe dinámico + optimización pools conexión

---

## 🚨 **PROBLEMA IDENTIFICADO EN DESARROLLO**

### **Saturación Pools SQLite Local:**
```
QueuePool limit of size 20 overflow 20 reached
```

### **Causa Raíz:**
- Smart Scalper modal: 200+ requests cada 5 segundos
- Requests simultáneas saturaban pool SQLite local
- Timeframes hardcoded causaban refresh innecesario

### **Solución Aplicada:**
- DL-100: Timeframe dinámico (5s → 1h según configuración usuario)
- Rate limiting adaptativos
- Pools optimizados para concurrencia

---

## 🏗️ **CONFIGURACIONES POSTGRESQL PRODUCTION**

### **1. Connection Pool Optimization:**

```python
# backend/database/postgresql_config.py (CREAR NUEVO)
from sqlalchemy.pool import QueuePool
from sqlalchemy import create_engine

# ✅ PostgreSQL Production Pool Configuration
def create_production_engine(database_url: str):
    return create_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=50,           # ⬆️ Base connections (vs SQLite 20)
        max_overflow=100,       # ⬆️ Overflow connections (vs SQLite 20)
        pool_timeout=60,        # ⬆️ Wait time seconds (vs SQLite 45)
        pool_recycle=3600,      # ♻️ Recycle connections every hour
        pool_pre_ping=True,     # 🏥 Health check connections
        echo=False              # 🔇 Disable SQL logging in production
    )
```

### **2. Environment Variables (.env.production):**

```bash
# PostgreSQL Production Database
DATABASE_URL=postgresql://user:password@hostname:5432/intelibotx_prod

# Connection Pool Settings
DB_POOL_SIZE=50
DB_MAX_OVERFLOW=100
DB_POOL_TIMEOUT=60
DB_POOL_RECYCLE=3600

# Request Rate Limiting
MAX_REQUESTS_PER_SECOND=100
SMART_SCALPER_MIN_INTERVAL=60  # Minimum 1 minute between requests
```

### **3. Railway PostgreSQL Configuration:**

```yaml
# railway.toml
[build]
  builder = "NIXPACKS"

[deploy]
  healthcheckPath = "/health"
  healthcheckTimeout = 300

[env]
  # PostgreSQL Pool Optimization
  DATABASE_POOL_SIZE = "50"
  DATABASE_MAX_OVERFLOW = "100"
  DATABASE_POOL_TIMEOUT = "60"

  # Rate Limiting Production
  RATE_LIMIT_ENABLED = "true"
  MAX_CONCURRENT_REQUESTS = "200"
```

---

## ⚙️ **BACKEND MODIFICATIONS PARA PRODUCTION**

### **1. Database Connection Manager:**

```python
# backend/database/connection_manager.py (CREAR NUEVO)
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .postgresql_config import create_production_engine

class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.setup_database()

    def setup_database(self):
        database_url = os.getenv("DATABASE_URL")

        if "postgresql" in database_url:
            # ✅ Production PostgreSQL Optimized
            self.engine = create_production_engine(database_url)
        else:
            # 🧪 Development SQLite (current settings)
            self.engine = create_engine(
                database_url,
                pool_size=20,
                max_overflow=20,
                pool_timeout=45
            )

        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )

    def get_session(self):
        return self.SessionLocal()

# Singleton instance
db_manager = DatabaseManager()
```

### **2. Rate Limiting Middleware:**

```python
# backend/middleware/rate_limiting.py (CREAR NUEVO)
import time
from fastapi import HTTPException, Request
from collections import defaultdict
from datetime import datetime, timedelta

class SmartScalperRateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.min_interval = int(os.getenv("SMART_SCALPER_MIN_INTERVAL", 60))

    async def check_rate_limit(self, request: Request, endpoint: str):
        client_ip = request.client.host
        user_id = getattr(request.state, "user_id", client_ip)

        now = datetime.now()
        key = f"{user_id}:{endpoint}"

        # Clean old requests
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if now - req_time < timedelta(seconds=self.min_interval)
        ]

        # Check if can make request
        if len(self.requests[key]) > 0:
            last_request = max(self.requests[key])
            if now - last_request < timedelta(seconds=self.min_interval):
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit: Smart Scalper requests limited to 1 per {self.min_interval}s"
                )

        # Record request
        self.requests[key].append(now)

rate_limiter = SmartScalperRateLimiter()
```

### **3. Smart Scalper Endpoint Optimized:**

```python
# backend/routes/bots.py - Modifications
from ..middleware.rate_limiting import rate_limiter

@router.post("/run-smart-trade/{symbol}")
async def run_smart_trade_analysis(
    symbol: str,
    request: Request,
    current_user=Depends(get_current_user_safe)
):
    # ✅ Rate limiting para Smart Scalper en production
    if os.getenv("RATE_LIMIT_ENABLED", "false") == "true":
        await rate_limiter.check_rate_limit(request, "smart_scalper")

    # Resto del análisis institucional...
```

---

## 📊 **MONITOREO Y MÉTRICAS PRODUCTION**

### **1. Database Pool Health Check:**

```python
# backend/routes/health.py (CREAR NUEVO)
from fastapi import APIRouter
from ..database.connection_manager import db_manager

router = APIRouter()

@router.get("/health/database")
async def database_health():
    engine = db_manager.engine
    pool = engine.pool

    return {
        "status": "healthy",
        "pool_size": pool.size(),
        "checked_out": pool.checkedout(),
        "overflow": pool.overflow(),
        "checked_in": pool.checkedin(),
        "timestamp": datetime.now().isoformat()
    }
```

### **2. Smart Scalper Metrics:**

```python
# backend/services/scalper_metrics.py (CREAR NUEVO)
from collections import defaultdict
import time

class ScalperMetrics:
    def __init__(self):
        self.requests_count = defaultdict(int)
        self.last_reset = time.time()

    def record_request(self, user_id: str, timeframe: str):
        current_time = time.time()

        # Reset hourly
        if current_time - self.last_reset > 3600:
            self.requests_count.clear()
            self.last_reset = current_time

        self.requests_count[f"{user_id}:{timeframe}"] += 1

    def get_metrics(self):
        return {
            "total_requests": sum(self.requests_count.values()),
            "unique_users": len(set(key.split(":")[0] for key in self.requests_count.keys())),
            "requests_by_timeframe": self._group_by_timeframe()
        }

    def _group_by_timeframe(self):
        timeframe_counts = defaultdict(int)
        for key, count in self.requests_count.items():
            timeframe = key.split(":")[1]
            timeframe_counts[timeframe] += count
        return dict(timeframe_counts)

scalper_metrics = ScalperMetrics()
```

---

## 🚀 **CHECKLIST DEPLOYMENT PRODUCTION**

### **Pre-Deployment:**
- [ ] Configurar variables entorno PostgreSQL Railway
- [ ] Aplicar pool configurations en DATABASE_URL
- [ ] Habilitar rate limiting: `RATE_LIMIT_ENABLED=true`
- [ ] Configurar `SMART_SCALPER_MIN_INTERVAL=60`

### **Post-Deployment:**
- [ ] Monitorear `/health/database` pool metrics
- [ ] Verificar logs no muestren pool saturation
- [ ] Confirmar Smart Scalper responde en timeframes dinámicos
- [ ] Validar performance con múltiples usuarios concurrentes

### **Rollback Plan:**
- [ ] Revertir a configuraciones SQLite temporalmente
- [ ] Reducir pool_size si saturación PostgreSQL
- [ ] Aumentar `SMART_SCALPER_MIN_INTERVAL` si necesario

---

## 📋 **CONFIGURACIONES ESPECÍFICAS RAILWAY**

### **PostgreSQL Database Settings:**
```
Max Connections: 500
Shared Buffers: 256MB
Work Memory: 8MB
Maintenance Work Memory: 128MB
Checkpoint Completion Target: 0.9
WAL Buffers: 16MB
```

### **Application Settings:**
```
Memory Limit: 2GB
CPU Limit: 2 vCPUs
Health Check: /health/database
Timeout: 300s
```

---

## ⚠️ **LESSONS LEARNED DE DESARROLLO**

### **SQLite Limitations Identificadas:**
1. **Pool Size:** 20 connections insufficient para Smart Scalper modal
2. **Timeout Handling:** 45s timeout causaba disconnections
3. **Concurrent Requests:** Modal generaba 200+ requests simultáneas
4. **Hardcoded Intervals:** 5s refresh saturaba pools innecesariamente

### **PostgreSQL Advantages:**
1. **Scalability:** 500+ concurrent connections nativas
2. **Performance:** Optimized para high-frequency trading data
3. **Reliability:** Connection pooling empresarial
4. **Monitoring:** Built-in metrics y health checks

---

*Actualizado: 2025-09-19*
*Contexto: Post DL-100 timeframe dinámico implementation*
*Objetivo: Evitar saturación pools en PostgreSQL Production*
*Metodología: Lessons learned de desarrollo + optimización preventiva*