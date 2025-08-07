# 🚀 InteliBotX Deployment Guide

## Railway Backend Deployment

### 1. Variables de Entorno Requeridas:

```bash
# Claves Binance Testnet
BINANCE_TESTNET_API_KEY=hvlvm0IkAvdq8z0tAYASCwQePJWMN5Fp49801MRMzP534JigjyI7ss4HcsAuaxR8
BINANCE_TESTNET_API_SECRET=BSZkejhRQVif1UyqqrVYKIuYhv1eKXxti5efieXRWMgcudNeLyptcudK2k97IbH0

# Claves Binance Mainnet (producción)
BINANCE_API_KEY=y57XhoSwqR9vM2M8gFZyuBFSTxo7IeeR8cmcOG1uQehLNfSL3veAFJ3tYmpZX0s9
BINANCE_SECRET_KEY=qJbU5ssW8LBBTgQROfCGDi8AgLD87mP0ayr6Sp6TKJ4wpRiIE4CrbEH1kZp6vfkH

# Configuración
USE_TESTNET=true
PYTHONPATH=.

# Seguridad (CRÍTICO - usar la misma key para consistency)
ENCRYPTION_MASTER_KEY=UzJ2cDRxNnM5djEyeDE1dzhaNHk3QjBGTjBkRzNIODJLZU5mV2pNanNJZz0=
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production-intelibotx-secure-2025

# Production settings
PORT=8000
HOST=0.0.0.0
```

### 2. Pasos Railway:

1. **Conectar Repo GitHub**:
   - Repository: `Eishler79/intelibotx`
   - Branch: `main`
   - Root directory: `/` (no subdirectory)

2. **Configurar Build**:
   - Build Command: `cd backend && pip install -r requirements.txt`
   - Start Command: `cd backend && gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

3. **Deploy Settings**:
   - Builder: Nixpacks
   - Health Check: `/` 
   - Region: us-west1 (recomendado)

---

## Vercel Frontend Deployment

### 1. Variables de Entorno Frontend:

```bash
# API Backend URL (actualizar después de Railway deployment)
VITE_API_BASE_URL=https://tu-nuevo-railway-url.railway.app
```

### 2. Pasos Vercel:

1. **Conectar Repo GitHub**:
   - Repository: `Eishler79/intelibotx` 
   - Branch: `main`
   - Root Directory: `frontend`

2. **Build Settings**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Deploy Settings**:
   - Node.js Version: 18.x
   - Install Command: `npm install`

---

## Testing Post-Deployment

### Backend Railway Testing:
```bash
# Health check
curl https://tu-railway-url.railway.app/

# Auth test
curl -X POST https://tu-railway-url.railway.app/api/init-auth-only

# Login test  
curl -X POST https://tu-railway-url.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@intelibotx.com", "password": "admin123"}'
```

### Frontend Vercel Testing:
```bash
# Access frontend
https://tu-vercel-app.vercel.app

# Test auth flow
1. Login with admin@intelibotx.com / admin123
2. Navigate to /bots-advanced
3. Verify API communication working
```

---

## URLs Esperados:

- **Backend Railway**: `https://intelibotx-production.up.railway.app`
- **Frontend Vercel**: `https://intelibotx.vercel.app`
- **API Docs**: `https://intelibotx-production.up.railway.app/docs`

---

## Troubleshooting:

### Railway Issues:
- ❌ Build failing → Check requirements.txt complete
- ❌ Port issues → Ensure PORT env var set
- ❌ Auth errors → Verify ENCRYPTION_MASTER_KEY matches local

### Vercel Issues:  
- ❌ Build failing → Check Node.js version 18.x
- ❌ API errors → Verify VITE_API_BASE_URL pointing to Railway
- ❌ CORS issues → Backend allows frontend domain

### Database Issues:
- ❌ Auth fails → Call `/api/init-auth-only` after deployment
- ❌ No admin user → Endpoint creates admin automatically
- ❌ Encryption errors → Consistent ENCRYPTION_MASTER_KEY required