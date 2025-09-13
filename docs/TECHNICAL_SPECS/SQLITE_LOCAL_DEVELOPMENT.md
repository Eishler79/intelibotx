# SQLITE_LOCAL_DEVELOPMENT.md - SQLite Configuration for Local Development

> **CRITICAL WARNING:** This configuration is EXCLUSIVELY for local development. DO NOT deploy to production.  
> **Production uses PostgreSQL with separate optimized configuration.**

---

## 🎯 **PURPOSE**

This document specifies SQLite connection pool configuration for local development environment to handle concurrent requests from frontend testing and development activities.

---

## ⚙️ **SQLITE POOL CONFIGURATION**

### **Connection Pool Settings (Development Only):**
```python
# SQLite connection pool settings for concurrent requests (DEVELOPMENT ONLY)
pool_size=20,           # Base connections - 20 simultaneous (user requirement)
max_overflow=20,        # Additional connections - 20 more (total: 40)
pool_timeout=45,        # Wait time for connection (increased)
pool_recycle=1800,      # Recycle connections every 30 minutes
pool_pre_ping=True,     # Validate connections before use

# SQLite-specific settings
connect_args={
    "check_same_thread": False,  # Allow multiple threads
    "timeout": 30                # SQLite timeout increased to 30s
}
```

### **Total Capacity:**
- **Base connections:** 20 simultaneous
- **Overflow connections:** 20 additional during peaks
- **Total capacity:** 40 concurrent connections maximum
- **Pool timeout:** 45 seconds wait time
- **SQLite timeout:** 30 seconds per query

---

## 🔧 **IMPLEMENTATION LOCATION**

**File:** `/Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend/db/database.py`

**Condition:** Applied only when `"postgresql" NOT in DATABASE_URL`

**Environment Detection:**
```python
if "postgresql" in DATABASE_URL:
    # PostgreSQL Production Configuration (Railway)
    # ... production pool settings ...
else:
    # SQLite Development Configuration (Local)
    # ... this SQLite configuration ...
```

---

## 🚨 **DEVELOPMENT vs PRODUCTION SEPARATION**

### **✅ DEVELOPMENT (SQLite):**
- **Environment:** `sqlite:///./intelibotx.db` (local file)
- **Purpose:** Frontend testing, bot creation, concurrent development requests
- **Pool size:** 20 base + 20 overflow = 40 total
- **Timeout:** 45s pool + 30s SQLite
- **Features:** `check_same_thread: False` for concurrency

### **🚀 PRODUCTION (PostgreSQL):**
- **Environment:** Railway PostgreSQL database
- **Purpose:** Production traffic, real trading operations
- **Pool size:** 20 base + 40 overflow = 60 total (different configuration)
- **Timeout:** 45s pool + 10s connect timeout
- **Features:** Advanced connection recycling + application naming

---

## 📋 **COMMIT GUIDELINES**

### **⚠️ CRITICAL DEPLOYMENT RULE:**
```bash
# ✅ SAFE - Automatic environment detection
git add backend/db/database.py
git commit -m "feat: SQLite pool config for local development (auto-detection)"

# ❌ NEVER manually override for production
# This configuration automatically applies only to local SQLite
# Production will use PostgreSQL configuration regardless
```

### **Environment Detection Logic:**
- **Local development:** Uses SQLite configuration when `DATABASE_URL=sqlite:///./intelibotx.db`
- **Railway production:** Uses PostgreSQL configuration when `DATABASE_URL=postgresql://...`
- **No manual environment switching required**

---

## 🐛 **PROBLEM SOLVED**

### **Error Before Fix:**
```
QueuePool limit of size 5 overflow 10 reached, connection timed out, timeout 30.00
Authentication error in get_current_user_safe: connection timed out
500 Server Error: Authentication failed
```

### **Error After Fix:**
```
✅ SQLite engine created for development
✅ Connection pool: 20 base + 20 overflow = 40 total capacity
✅ Timeouts: 45s pool + 30s SQLite
✅ Concurrent requests handled successfully
```

---

## 🔄 **CONCURRENT REQUEST SCENARIOS**

### **Frontend Development Activity:**
- **Bot creation modal:** Multiple API calls per action
- **Dashboard refresh:** Real-time data requests every 10s  
- **Trading operations:** Multiple concurrent bot operations
- **Authentication:** JWT validation on every request
- **Market data:** Symbol price updates + balance checks

### **Pool Utilization:**
- **Normal operation:** 5-10 connections used
- **Peak development:** 15-25 connections during intensive testing
- **Maximum capacity:** 40 connections available for concurrent bursts
- **Failover:** Pool timeout prevents infinite waits

---

## 📊 **MONITORING**

### **Validation Commands:**
```bash
# Check SQLite engine initialization
tail -f backend/logs/app.log | grep "SQLite engine created"

# Monitor connection pool usage
# (SQLite doesn't provide detailed pool metrics like PostgreSQL)

# Test concurrent connections
curl -X GET http://localhost:8000/api/bots/2/trading-summary
```

### **Performance Metrics:**
- **Connection acquisition:** <1s under normal load
- **Pool exhaustion prevention:** 45s timeout before failure
- **SQLite query timeout:** 30s maximum per operation
- **Connection recycling:** Every 30 minutes for health

---

*Created: 2025-09-10*  
*Purpose: Local development SQLite pool configuration*  
*Scope: Development environment only - NOT for production deployment*  
*Production: Uses separate PostgreSQL configuration automatically*