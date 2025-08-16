# OPCIÓN B PATTERN - Manual Authentication
## SPEC_REF Central para Authentication Fixes

> **REGLA CRÍTICA:** Este archivo contiene el patrón exacto para NUNCA OLVIDAR los cambios de authentication

---

## 🎯 PATRÓN OPCIÓN B - SPEC_REF DEFINITIVO

### **PROBLEMA:**
FastAPI dependency injection `await get_current_user()` causa error:
```
AttributeError: 'Depends' object has no attribute 'credentials'
```

### **SOLUCIÓN OPCIÓN B:**
Manual JWT authentication usando `auth_service` methods

---

## 📋 DIFF EXACTO - APLICAR SIEMPRE

### **ANTES (ROTO):**
```python
@router.get("/api/endpoint")
async def endpoint_function():
    try:
        # Lazy imports
        from services.auth_service import get_current_user
        from db.database import get_session
        
        # Get actual dependencies
        current_user = await get_current_user()
        session = get_session().__next__()
```

### **DESPUÉS (OPCIÓN B):**
```python
@router.get("/api/endpoint")
async def endpoint_function(
    authorization: str = Header(None)
):
    try:
        # Lazy imports
        from db.database import get_session
        from services.auth_service import auth_service
        from fastapi import HTTPException, status, Header
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Manual authentication - Opción B con estándares de seguridad
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header required"
            )
        
        # Extract and validate JWT token using existing service methods
        try:
            token = auth_service.get_token_from_header(authorization)
            token_data = auth_service.verify_jwt_token(token)
            
            # Get database session and user
            session = get_session()
            current_user = auth_service.get_user_by_id(token_data["user_id"], session)
            
            if not current_user or not current_user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or inactive"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error in endpoint_function: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication"
            )
```

---

## 🔍 IMPORTS REQUERIDOS

### **AGREGAR AL ARCHIVO:**
```python
from fastapi import APIRouter, HTTPException, Query, Header  # NO Depends
```

### **REMOVER DEL ARCHIVO:**
```python
from fastapi import Depends  # ELIMINAR ESTA LÍNEA
```

---

## ✅ VALIDACIÓN OPCIÓN B

### **CHECKLIST OBLIGATORIO:**
- [ ] ✅ Parámetro `authorization: str = Header(None)` agregado
- [ ] ✅ Import `from services.auth_service import auth_service` (NO get_current_user)
- [ ] ✅ Manual token extraction con `get_token_from_header()`
- [ ] ✅ JWT validation con `verify_jwt_token()`
- [ ] ✅ User lookup con `get_user_by_id()`
- [ ] ✅ Error handling completo con logging
- [ ] ✅ Lazy imports mantenidos
- [ ] ✅ No import `Depends` en el archivo

---

## 🎯 ARCHIVOS COMPLETADOS CON OPCIÓN B

### **✅ COMPLETADOS (24 endpoints):**
- **auth.py:** 3/11 endpoints ✅
- **exchanges.py:** 7/7 endpoints ✅ 
- **bots.py:** 9/9 endpoints ✅
- **trading_operations.py:** 5/5 endpoints ✅

### **❌ PENDIENTES (20 endpoints):**
- **auth.py:** 8/11 endpoints restantes
- **dashboard_data.py:** 4/4 endpoints  
- **dashboard_api.py:** 3/3 endpoints
- **real_trading_routes.py:** 3/10 endpoints
- **routes/available_symbols.py:** Revisar si requiere auth
- **routes/execution_metrics.py:** Revisar si requiere auth

---

## 🚨 ERRORES COMUNES A EVITAR

### **❌ NO HACER:**
```python
from services.auth_service import get_current_user  # ROTO
current_user = await get_current_user()  # ROTO
session = get_session().__next__()  # Puede fallar
```

### **✅ HACER:**
```python
from services.auth_service import auth_service  # CORRECTO
session = get_session()  # CORRECTO
current_user = auth_service.get_user_by_id(token_data["user_id"], session)  # CORRECTO
```

---

## 📋 METODOLOGÍA CRÍTICA APLICAR

### **PASO 1 - DIAGNÓSTICO SEGURO:**
```bash
# Buscar endpoints rotos
grep -n "await get_current_user()" routes/archivo.py

# Verificar dependencias disponibles  
python -c "from services.auth_service import auth_service; print('OK')"
```

### **PASO 2 - APLICAR DIFF:**
- Usar EXACTAMENTE el patrón DESPUÉS de este archivo
- Aplicar línea por línea el diff
- Mantener lazy imports y DL-001 compliance

### **PASO 3 - TESTING LOCAL:**
```bash
# Validar sintaxis
python -m py_compile routes/archivo.py

# Test imports
python -c "from routes.archivo import router; print('OK')"
```

### **PASO 4 - COMMIT + PRD:**
```bash
git add routes/archivo.py
git commit -m "🔧 fix: Apply Option B authentication to [ENDPOINT_NAME]"
git push
```

### **PASO 5 - HOMOLOGACIÓN:**
```bash
# Test endpoint en PRD
curl -s "https://intelibotx-production.up.railway.app/api/endpoint" | grep "Authorization header required"
```

---

## 🎯 REGLA DE ORO

**NUNCA TOCAR UN ENDPOINT SIN:**
1. Leer este archivo COMPLETO
2. Aplicar el DIFF EXACTO 
3. Seguir la METODOLOGÍA CRÍTICA
4. Validar los 5 PASOS

**Este archivo ES LA VERDAD ABSOLUTA para authentication fixes.**