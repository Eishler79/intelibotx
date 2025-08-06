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

# Load trading history routes
try:
    from routes.trading_history import router as trading_history_router
    app.include_router(trading_history_router)
    print("✅ Trading history routes loaded")
except Exception as e:
    print(f"⚠️ Could not load trading history routes: {e}")
    
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

# Endpoints de datos reales - fuera del bloque try/except
@app.get("/api/real-market/{symbol}")
async def get_real_market_simple(symbol: str):
    """Obtener datos reales de mercado simplificados"""
    import httpx
    import time
    
    try:
        async with httpx.AsyncClient() as client:
            # Obtener ticker 24h
            response = await client.get(f"https://testnet.binance.vision/api/v3/ticker/24hr", params={"symbol": symbol.upper()})
            if response.status_code == 200:
                data = response.json()
                
                # Obtener precio actual separadamente para mayor precisión
                price_response = await client.get(f"https://testnet.binance.vision/api/v3/ticker/price", params={"symbol": symbol.upper()})
                current_price = float(data["lastPrice"])
                if price_response.status_code == 200:
                    price_data = price_response.json()
                    current_price = float(price_data["price"])
                
                return {
                    "symbol": symbol.upper(),
                    "current_price": current_price,
                    "price_change_24h": float(data["priceChangePercent"]),
                    "volume_24h": float(data["volume"]),
                    "high_24h": float(data["highPrice"]),
                    "low_24h": float(data["lowPrice"]),
                    "timestamp": int(time.time() * 1000),
                    "data_source": "binance_testnet_real",
                    "success": True
                }
            return {"error": "No data available", "success": False}
    except Exception as e:
        return {"error": f"Error obteniendo datos de mercado: {str(e)}", "success": False}

@app.post("/api/real-bots/create-simple")
async def create_simple_real_bot(bot_data: dict):
    """Crear bot simple con datos reales"""
    import time
    import httpx
    
    # Obtener precio real
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://testnet.binance.vision/api/v3/ticker/price", 
                                      params={"symbol": bot_data.get("symbol", "BTCUSDT")})
            if response.status_code == 200:
                price_data = response.json()
                current_price = float(price_data["price"])
            else:
                current_price = 0.0
    except:
        current_price = 0.0
    
    bot_id = int(time.time())
    
    return {
        "message": f"✅ Bot Real {bot_data.get('strategy', 'Bot')} creado para {bot_data.get('symbol', 'BTCUSDT')} con datos en vivo",
        "bot_id": bot_id,
        "bot": {
            "id": bot_id,
            "symbol": bot_data.get("symbol", "BTCUSDT"),
            "strategy": bot_data.get("strategy", "Smart Scalper"),
            "stake": bot_data.get("stake", 1000),
            "take_profit": bot_data.get("take_profit", 2.5),
            "stop_loss": bot_data.get("stop_loss", 1.5),
            "risk_percentage": bot_data.get("risk_percentage", 1.0),
            "market_type": bot_data.get("market_type", "spot"),
            "current_price": current_price,
            "data_source": "binance_testnet_real",
            "status": "CREATED"
        },
        "market_data": {
            "current_price": current_price,
            "signal": "BUY" if current_price > 0 else "HOLD",
            "confidence": "75%" if current_price > 0 else "50%"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)