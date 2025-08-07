# Guía de trabajo con Claude • InteliBotX

Este documento **unifica el contexto completo** del proyecto InteliBotX desarrollado por Eduard Guzmán.
Claude debe seguir las reglas del archivo `claude/claude_project_system_prompt.txt`.

## ⚠️ REGLAS CRÍTICAS DE DESARROLLO

### 🚫 **NO SOBREESCRIBIR CÓDIGO FUNCIONAL**
**NUNCA eliminar o reemplazar funcionalidades que YA FUNCIONAN** sin explícita autorización del usuario.

#### ✅ **Permitido:**
- **Arreglar errores** en código que no funciona
- **Agregar nuevas funcionalidades** sin afectar las existentes  
- **Mejorar performance** manteniendo funcionalidad intacta
- **Refactorizar** solo si se mantiene 100% la funcionalidad

#### ❌ **PROHIBIDO:**
- **Eliminar características** que funcionan correctamente
- **Cambiar comportamiento** de funciones estables
- **Reemplazar componentes** sin verificar compatibilidad completa
- **Modificar APIs** que ya están integradas y funcionando

#### 🔍 **Antes de cada cambio:**
1. **Verificar** que la funcionalidad actual no se rompa
2. **Probar en local** antes de hacer commit/push
3. **Preguntar al usuario** si hay dudas sobre mantener funcionalidad
4. **Documentar** qué se mantiene intacto vs. qué se modifica

### 📋 **Flujo Obligatorio:**
1. **Identificar** funcionalidades existentes que DEBEN mantenerse
2. **Probar en local** con `npm run dev` antes de commit
3. **Solo hacer push** cuando esté 100% verificado
4. **Documentar** cambios sin afectar código estable

## 🎯 CONTEXTO GENERAL DEL PROYECTO

**InteliBotX** es un sistema de trading inteligente que comprende:
- **Backend**: FastAPI con análisis técnico, detección de manipulación e IA
- **Frontend**: React/Vite/Tailwind con interfaz moderna y responsive  
- **Objetivo**: Plataforma completa para trading automatizado y SmartTrade manual

## 📊 ESTADÍSTICAS DEL PROYECTO

### Resumen Técnico:
- **Líneas de código**: ~20,000+ líneas (sistema auth + seguridad + BinanceService)
- **Archivos Python**: 95+ archivos backend (completo sistema seguro)
- **Componentes React**: 22+ componentes frontend + auth components planificados
- **Dependencias**: 80+ librerías Python (JWT, bcrypt, cryptography, binance-connector)
- **Commits acumulados**: 20+ commits con FASE 0 completada
- **Issues resueltos**: 30/30 issues críticos + FASE 0 seguridad COMPLETADA
- **🔒 Autenticación JWT**: Sistema login/register 100% funcional
- **🔐 Encriptación AES-256**: API keys Binance completamente seguras
- **🏦 Binance Real**: Testnet validado - BTCUSDT live + balances reales
- **📊 Base datos**: SQLite multi-usuario con foreign keys

### Estado Actual (08-Agosto-2025)

#### ✅ ETAPA 1 COMPLETADA - Consolidación Crítica
- ✅ **7 fixes críticos aplicados exitosamente**
- ✅ **Consolidación de proyecto unificado**
- ✅ **Testing local backend y frontend exitoso**
- ✅ **Deployment en Railway resuelto con Gunicorn**
- ✅ **GitHub actualizado con todos los cambios**

#### ✅ CONTINUACIÓN SESIÓN 05-AGOSTO-2025 - Testing y Validación Completa
- ✅ **Migración completa a estructura INTELIBOTX/** (backend/ + frontend/)
- ✅ **Fix de rutas duplicadas testnet** (/testnet/testnet/ → /testnet/)
- ✅ **Corrección variables de entorno** (BINANCE_TESTNET_API_SECRET)
- ✅ **Testing sistemático de TODOS los endpoints** (14/14 validados)
- ✅ **APIs core funcionando al 100%** (10/10 endpoints)
- ✅ **Manejo de errores mejorado** en endpoints testnet
- ✅ **Documentación automática FastAPI** verificada

#### ✅ SESIÓN 06-AGOSTO-2025 - Deployment Producción y Endpoints Fallback
- ✅ **Deployment en producción exitoso** (Railway + Vercel funcionando)
- ✅ **Endpoints fallback implementados** - Fix errores 404 en bots
- ✅ **Sistema completamente funcional** - https://intelibotx.vercel.app/bots-advanced
- ✅ **CRUD bots validado en producción** - Crear, eliminar, start/pause funcionando
- ✅ **Preparación para APIs reales** - Testnet configurado para siguiente fase

#### 🚀 SESIÓN 07-AGOSTO-2025 - FASE 0 SEGURIDAD + BINANCE REAL COMPLETADA
- 🔒 **Sistema de autenticación JWT implementado** - Login/register funcionando
- 🔐 **Encriptación AES-256 para API keys** - Credenciales Binance seguras
- 👤 **Base de datos usuarios creada** - SQLModel con claves encriptadas
- 🏦 **Conexión REAL con Binance testnet** - Validación exitosa de credenciales
- 📊 **Datos de mercado en vivo** - BTCUSDT $116,256.19 desde testnet real
- 🧪 **Testing autenticación completo** - Admin user creado automáticamente
- 📈 **BinanceService funcional** - APIs reales validando cuentas testnet
- ⚡ **OBJETIVO LOGRADO**: Sistema preparado para datos reales sin .env públicos

#### 🔧 Fixes Críticos Implementados (Acumulativo):
1. **Importaciones corregidas** en `routes/bots.py` - AnalyticsEngine
2. **Base de datos unificada** - Eliminada duplicación `db/sqlite.py`
3. **Strategy evaluator consolidado** - Solo `analytics/strategy_evaluator.py`
4. **Páginas frontend funcionalizadas** - Bots.jsx, SmartTrade.jsx
5. **Rutas corregidas** - App.jsx con imports y rutas correctas
6. **Código consolidado** - Eliminación de duplicaciones
7. **URLs API estandarizadas** - Coherencia frontend/backend
8. **Rutas testnet corregidas** - Eliminación duplicación de prefijos
9. **Variables entorno testnet** - Fix BINANCE_TESTNET_API_SECRET
10. **Testing completo APIs** - 14 endpoints validados sistemáticamente
11. **Endpoints fallback bots** - Fix errores 404 en Railway deployment
12. **Deployment producción exitoso** - Sistema funcionando en https://intelibotx.vercel.app
13. **🆕 ERROR N.toFixed RESUELTO** - Validaciones numéricas en startBotTrading
14. **🆕 ERROR I.toFixed RESUELTO** - Number() wrapper en todos los componentes
15. **🆕 ERROR JSON Parse RESUELTO** - safeJsonParse implementado en api.ts
16. **🆕 5 Componentes corregidos** - ProfessionalBotsTable, LiveTradingFeed, TradingHistory, AdvancedMetrics, BotsAdvanced
17. **🆕 Sistema 100% estable** - Botón Play funcionando sin errores (confirmado por usuario)
18. **🔒 NUEVO: Autenticación JWT implementada** - Sistema login/register seguro
19. **🔐 NUEVO: API Keys encriptadas** - AES-256 para credenciales Binance
20. **👤 NUEVO: Base datos usuarios** - SQLModel con foreign keys y encriptación
21. **🏦 NUEVO: BinanceService real** - Conexión testnet validando cuentas reales
22. **📊 NUEVO: Datos mercado live** - BTCUSDT y order book desde testnet real
23. **⚡ NUEVO: FASE 0 COMPLETADA** - Seguridad + datos reales sin .env públicos

#### 🚀 Deployment y Testing:
- ✅ **Estructura migrada** - INTELIBOTX/backend/ + INTELIBOTX/frontend/
- ✅ **APIs core funcionando** - 10/10 endpoints al 100%
- ✅ **CRUD bots completo** - Crear, leer, actualizar, eliminar
- ✅ **Smart Trade funcional** - Análisis técnico completo
- ✅ **Backtest operativo** - Con gráficos HTML
- ✅ **Testnet configurado** - Claves cargadas (pueden requerir renovación)
- ✅ **Documentación Swagger** - /docs endpoint funcionando

#### 📈 Estado del Proyecto:
- **Coherencia API/UI**: ✅ 100% sincronizada  
- **Testing local**: ✅ Backend y Frontend funcionando
- **APIs validadas**: ✅ 10/10 core endpoints + 4/4 testnet (configurados)
- **🔒 Autenticación**: ✅ JWT system funcionando + admin user creado
- **🔐 Seguridad**: ✅ API keys encriptadas AES-256 + base datos usuarios
- **🏦 Binance Real**: ✅ Testnet connection validada + datos mercado live
- **GitHub**: ✅ Actualizado con todos los commits
- **Railway**: ✅ Deployment exitoso en producción
- **Vercel**: ✅ Deployment exitoso en producción  
- **Sistema en Producción**: ✅ https://intelibotx.vercel.app funcionando
- **Sistema Robusto**: ✅ FASE 0 COMPLETADA - Sin .env públicos, datos reales

#### 🧪 Testing Realizado (07-Agosto - COMPLETADO FASE 0):
- **Sistema Core**: ✅ API running, documentación
- **Análisis Trading**: ✅ Backtest charts, Smart Trade, símbolos disponibles  
- **Gestión Bots**: ✅ CRUD completo (crear, listar, actualizar, eliminar)
- **🔒 Autenticación JWT**: ✅ Login admin@intelibotx.com exitoso
- **🔐 API Keys Seguras**: ✅ Encriptación AES-256 funcionando
- **🏦 Binance Testnet**: ✅ Conexión real validada - Cuenta trade habilitada
- **📊 Datos Live**: ✅ BTCUSDT $116,256.19 desde testnet real
- **Frontend**: ✅ Comunicación API exitosa
- **🆕 Bot Trading**: ✅ Activación sin errores, PnL updates, métricas dinámicas
- **🆕 Error Resolution**: ✅ Todos los errores críticos N.toFixed/I.toFixed/JSON Parse resueltos
- **🆕 Sistema Estable**: ✅ Usuario confirmó corrección completa de errores
- **🔒 FASE 0 COMPLETADA**: ✅ Sistema seguro + datos reales sin exposición .env

#### 🎯 TESTING COMPLETO FASE 0 - 07-AGOSTO-2025:

##### 🔐 **AUTENTICACIÓN 100% FUNCIONAL:**
```bash
# Credenciales Demo
Email: admin@intelibotx.com
Password: admin123

# Endpoints Validados:
✅ POST /api/auth/login - Token JWT generado
✅ GET /api/auth/me - Info usuario autenticado
✅ POST /api/auth/test-binance-connection - Validación exitosa
✅ GET /api/auth/binance-account - Balance real obtenido
✅ GET /api/bots - Lista de bots (vacía inicialmente)
```

##### 🏦 **BINANCE TESTNET DATOS REALES:**
```json
{
  "account_type": "SPOT",
  "can_trade": true,
  "can_withdraw": true,
  "can_deposit": true,
  "balances": [
    {"asset": "USDT", "free": 10087.8354142},
    {"asset": "BTC", "free": 0.99992},
    {"asset": "ETH", "free": 1.0}
    // ... +400 assets más disponibles
  ]
}
```

##### 🔒 **SEGURIDAD VALIDADA:**
```bash
# ✅ Encriptación AES-256 funcionando
# ✅ Master key fija en .env (no regenera)
# ✅ API keys Binance encriptadas en base datos
# ✅ JWT tokens con expiración configurada
# ✅ Sin credenciales expuestas en código
```

##### 📊 **BASE DATOS USUARIOS:**
```sql
-- ✅ Tables creadas exitosamente:
-- user (con campos encriptados)
-- usersession (para JWT management)  
-- botconfig (con user_id foreign key)
-- trading_orders (deshabilitada para Railway)
```

##### 🚀 **DEPLOYMENT STATUS:**
- **Local**: ✅ Backend (8000) + Frontend (5174) funcionando
- **Railway**: ✅ Preparado para deployment limpio con auth
- **Vercel**: ✅ Preparado para deployment limpio con auth
- **Database**: ✅ SQLite inicializada con admin user

> **Última actualización**: 08-Agosto-2025 - Mañana  
> **Estado**: FASE 0 COMPLETADA ✅ + Documentación Actualizada  
> **Próximo**: Clean deployments + Frontend authentication components  
> **Avance**: Backend security 100% + datos reales Binance + ready para FASE 1

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### 🔒 FASE 0 AUTENTICACIÓN + SEGURIDAD - COMPLETADO ✅

**🎉 FASE 0 BACKEND SEGURO 100% COMPLETADO:**

1. **🔒 Autenticación JWT**:
   - ✅ Sistema login/register implementado
   - ✅ Token generation y validation funcionando  
   - ✅ Admin user: admin@intelibotx.com / admin123
   - ✅ Testing completo con endpoints validados

2. **🔐 API Keys Encriptadas**:
   - ✅ AES-256 encryption para credenciales Binance
   - ✅ Base datos usuarios con foreign keys
   - ✅ Master key fija en .env para consistencia
   - ✅ Encriptación/desencriptación validada

3. **🏦 Binance Real Conexión**:
   - ✅ BinanceService validando testnet accounts
   - ✅ Datos mercado live: BTCUSDT + balances reales
   - ✅ Account validation: can_trade = True  
   - ✅ +400 assets disponibles en cuenta testnet

4. **📊 Base Datos Completa**:
   - ✅ User model con campos encriptados
   - ✅ BotConfig con user_id foreign key
   - ✅ UserSession para JWT management
   - ✅ Admin user creado automáticamente

### 🚀 PRÓXIMOS PASOS - FASE 1: ENHANCED AUTH + EXCHANGE INTEGRATION

**PRIORIDAD INMEDIATA (09-Agosto-2025)** - Según screenshot usuario:

1. **🎨 Enhanced Auth Page con Multi-Provider** - CRÍTICO:
   - ⚡ **Binance OAuth** - Login directo con cuenta Binance
   - ⚡ **Google OAuth** - Sign in with Google
   - ⚡ **Apple OAuth** - Sign in with Apple ID  
   - ⚡ **Facebook OAuth** - Sign in with Facebook
   - ⚡ **Email/Password** - Método tradicional
   - ⚡ Diseño exacto según imagen usuario
   - ⚡ Auto-setup exchange si login con Binance

2. **🔧 Exchange Configuration System**:
   - ⚡ **Binance Setup Interface** - API keys configuration
   - ⚡ **Connection Testing** con feedback visual
   - ⚡ **Balance Verification** + permissions validation
   - ⚡ **Multi-exchange architecture** (preparado expansión)
   - ⚡ **Security warnings** + best practices

3. **🤖 Enhanced Bot Creation con Datos Reales**:
   - ⚡ **Nombres personalizados** ("Bot Fuerte Austero", etc.)
   - ⚡ **Market type SPOT/FUTURES** con leverage dinámico 1-125x
   - ⚡ **Valores monetarios dinámicos** calculados tiempo real
   - ⚡ **Entry/Exit management** avanzado (Market/Limit/DCA)
   - ⚡ **Real balance + live prices** desde exchange usuario
   - ⚡ **Template system** configuraciones predefinidas

4. **🔐 Protected Routes + Exchange Validation**:
   - ⚡ **Multi-step onboarding**: Auth → Exchange Setup → Bots
   - ⚡ **Exchange Guard** validation para bot access
   - ⚡ **Enhanced AuthContext** multi-provider support
   - ✅ Backend security 100% preparado

### 🎯 PRÓXIMA FASE - APIs REALES BINANCE:
- 🔄 **Configurar claves API Binance testnet** - Activar trading real
- 🔄 **Implementar precios reales** - Conectar datos de mercado en vivo  
- 🔄 **Crear órdenes reales** - Sistema de trading automático
- 🔄 **Documentar estrategias bots** - Funcionalidades y algoritmos

### 🎯 OBJETIVO INMEDIATO - SISTEMA COMPLETO CON DATOS REALES:

#### **FASE 1** (Días 9-12 - Enhanced Auth + Exchange):
- 🎨 **Multi-Provider Auth** - Binance, Google, Apple, Facebook + Email según screenshot
- 🔧 **Exchange Configuration** - Binance setup + multi-exchange architecture
- 🔐 **Enhanced Security** - User-specific API keys + validation comprehensive
- 🏦 **Real Data Integration** - Balance + prices + limits desde exchange usuario

#### **FASE 1B** (Día 13 - Bot Creation Enhanced):
- 🤖 **Nombres Personalizados** - "Bot Fuerte Austero", "Bot Agresivo Alpha"
- 💰 **Valores Monetarios Dinámicos** - TP/SL calculados tiempo real
- ⚖️ **Market Type SPOT/FUTURES** - Leverage 1-125x + margin type
- 🎯 **Entry/Exit Management** - Market/Limit/DCA + TP/SL avanzado
- 📋 **Template System** - Configuraciones predefinidas + persistencia

#### **OBJETIVO FUTURO - BOTS IA INTELIGENTES:**
- 🚀 **IntelliBot Engine** - Motor de bots con IA superior a 3Commas
- 🎨 **Interfaz Avanzada** - Dashboard con visualizaciones profesionales  
- 🧠 **Análisis Multi-timeframe** - Integración completa ecosistema analytics
- ⚡ **Performance Tiempo Real** - Métricas avanzadas + control dinámico

### ETAPA 2A - BOTS CON IA VERDADERA (Prioridad Máxima):

#### 🧠 **MOTOR DE BOTS INTELIGENTE - Superior a 3Commas:**
1. **IntelliBot Engine** - Motor con IA que integra:
   - Analytics multi-timeframe (5m, 15m, 1h, 4h, 1d)
   - Manipulation detector en tiempo real
   - News sentiment analysis automático
   - Candlestick pattern recognition avanzado
   - Machine Learning para predicciones
   - Adaptación dinámica a volatilidad

2. **Tipos de Bots IA:**
   - **Smart Scalper** - IA para micro-movimientos con anti-manipulación
   - **Trend Hunter** - Detección de tendencias emergentes con ML
   - **Flash Crash Protector** - Protección automática contra manipulación
   - **Market Maker** - Creación de liquidez inteligente
   - **Predictive Bot** - Predicciones con redes neuronales

3. **Interfaz Avanzada:**
   - Dashboard con TradingView integrado
   - Métricas avanzadas (Sharpe, Sortino, Calmar, etc.)
   - Control en tiempo real de parámetros
   - Backtesting interactivo multi-símbolo
   - Análisis de comportamiento del bot con IA
   - Alertas inteligentes y notificaciones push

4. **Sistema de Evaluación:**
   - Performance scoring con ML
   - Risk assessment automático  
   - Market condition adaptation
   - Portfolio optimization suggestions

### ETAPA 2B - Robustez (Después de Bots IA):
1. **Manejo de errores mejorado** - Try/catch comprehensivos
2. **Logging estructurado** - Winston/Pino para mejor debugging  
3. **Validación de datos robusta** - Pydantic schemas completos
4. **Testing automatizado** - Pytest + Jest test suites
5. **Monitoreo y salud** - Health checks y métricas

## ⚡ COMANDOS DE DESARROLLO

### Backend (INTELIBOTX/backend/):
```bash
# Cambiar a directorio backend
cd /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend

# Activar entorno virtual (si existe)
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar desarrollo
uvicorn main:app --reload --host=0.0.0.0 --port=8000

# Testing
pytest tests/ -v
```

### Frontend (INTELIBOTX/frontend/):
```bash
# Cambiar a directorio frontend
cd /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend

# Instalar dependencias
npm install

# Ejecutar desarrollo
npm run dev

# Build producción
npm run build

# Preview
npm run preview
```

### Deployment:
```bash
# Git workflow
git add -A
git commit -m "descripción del cambio"
git push origin main

# Railway auto-deploy desde main branch
# Vercel auto-deploy desde main branch
```

## 🔒 SISTEMA DE SEGURIDAD IMPLEMENTADO - FASE 0 COMPLETADA

### Backend Authentication (100% Funcional):
- **JWT Authentication**: Login/register con tokens seguros
- **API Key Encryption**: AES-256 para credenciales Binance
- **User Management**: Base datos SQLite con foreign keys
- **Binance Integration**: Conexión real testnet validada

### Endpoints Auth Disponibles:
```bash
# Autenticación
POST /api/auth/register        # Registro nuevo usuario
POST /api/auth/login          # Login con JWT token
GET  /api/auth/me             # Info usuario autenticado

# API Keys Management
POST /api/auth/update-api-keys     # Actualizar credenciales
POST /api/auth/test-binance-connection  # Test conexión
GET  /api/auth/binance-account     # Balance y info cuenta

# Bot Management con Auth
GET  /api/bots                # Bots del usuario autenticado
POST /api/create-bot          # Crear bot para usuario
```

### Credenciales Demo (Testing):
```bash
Email: admin@intelibotx.com
Password: admin123
Balance Testnet: 10,087.83 USDT
Status: can_trade = true
```

### 🏗️ Arquitectura Backend Segura:
```
INTELIBOTX/backend/
├── models/
│   ├── user.py                    # User + UserSession models
│   └── bot_config.py              # BotConfig con user_id FK
├── services/
│   ├── auth_service.py            # JWT + password hashing
│   ├── encryption_service.py      # AES-256 API keys
│   └── binance_service.py         # Real Binance connector
├── routes/
│   └── auth.py                    # Authentication endpoints
└── main.py                        # Auto-create admin user
```
