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
# Load core routes first (most stable)
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

# Load smart trade routes
try:
    from routes.smart_trade_routes import router as smart_trade_router
    app.include_router(smart_trade_router, prefix="/api")
    print("✅ Smart trade routes loaded")
except Exception as e:
    print(f"⚠️ Could not load smart trade routes: {e}")

# Load bots routes last (newest/most complex)
try:
    from routes.bots import router as bots_router
    app.include_router(bots_router)
    print("✅ Bots routes loaded")
except Exception as e:
    print(f"⚠️ Could not load bots routes: {e}")

# Load real bots routes with live market data
try:
    from routes.real_bots import router as real_bots_router
    app.include_router(real_bots_router)
    print("✅ Real bots routes loaded")
except Exception as e:
    print(f"⚠️ Could not load real bots routes: {e}")
    
    # Create fallback endpoints for basic bot operations
    @app.get("/api/bots")
    async def fallback_get_bots():
        return []  # Start empty instead of demo bot
    
    @app.post("/api/create-bot")
    async def fallback_create_bot(bot_data: dict):
        # Generate a simple ID
        import time
        bot_id = int(time.time())
        
        return {
            "message": f"✅ Bot {bot_data.get('strategy', 'Bot')} creado para {bot_data.get('symbol', 'UNKNOWN')} (MODO DEMO)",
            "bot_id": bot_id,
            "bot": {
                "id": bot_id,
                "symbol": bot_data.get("symbol", "BTCUSDT"),
                "strategy": bot_data.get("strategy", "Smart Scalper"),
                "stake": bot_data.get("stake", 1000),
                "take_profit": bot_data.get("take_profit", 2.5),
                "stop_loss": bot_data.get("stop_loss", 1.5),
                "risk_percentage": bot_data.get("risk_percentage", 1.0),
                "market_type": bot_data.get("market_type", "spot")
            }
        }
    
    @app.delete("/api/bots/{bot_id}")
    async def fallback_delete_bot(bot_id: int):
        return {
            "message": f"🗑️ Bot eliminado (MODO DEMO)",
            "bot_id": bot_id
        }
    
    @app.post("/api/bots/{bot_id}/start")
    async def fallback_start_bot(bot_id: int):
        return {
            "message": f"🚀 Bot {bot_id} iniciado (MODO DEMO)",
            "bot_id": bot_id,
            "status": "RUNNING"
        }
    
    @app.post("/api/bots/{bot_id}/pause")  
    async def fallback_pause_bot(bot_id: int):
        return {
            "message": f"⏸️ Bot {bot_id} pausado (MODO DEMO)",
            "bot_id": bot_id,
            "status": "PAUSED"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)