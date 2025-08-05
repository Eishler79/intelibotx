from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Crear aplicación FastAPI
app = FastAPI(
    title="InteliBotX API",
    description="Sistema de trading inteligente con FastAPI",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        # Import here to avoid circular imports
        from sqlmodel import create_engine, SQLModel
        from models.bot_config import BotConfig
        
        DATABASE_URL = "sqlite:///./bots.db"
        engine = create_engine(DATABASE_URL, echo=False)
        SQLModel.metadata.create_all(engine)
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"⚠️ Database initialization warning: {e}")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "InteliBotX API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/api/health")
async def health():
    """Health check for monitoring"""
    return {"status": "ok", "message": "API is running"}

# Import routes only after app is created
try:
    from routes.bots import router as bots_router
    app.include_router(bots_router)
    print("✅ Bots routes loaded")
except Exception as e:
    print(f"⚠️ Could not load bots routes: {e}")

try:
    from routes.smart_trade_routes import router as smart_trade_router
    app.include_router(smart_trade_router, prefix="/api")
    print("✅ Smart trade routes loaded")
except Exception as e:
    print(f"⚠️ Could not load smart trade routes: {e}")

try:
    from routes.available_symbols import router as symbols_router
    app.include_router(symbols_router, prefix="/api")
    print("✅ Symbols routes loaded")
except Exception as e:
    print(f"⚠️ Could not load symbols routes: {e}")

try:
    from routes.testnet import router as testnet_router
    app.include_router(testnet_router)
    print("✅ Testnet routes loaded")
except Exception as e:
    print(f"⚠️ Could not load testnet routes: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)