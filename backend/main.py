from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
import os

from routes import bots
from routes.smart_trade_routes import router as smart_trade_router
from routes.available_symbols import router as symbols_router
from routes.testnet import router as testnet_router
from routes import bot_routes
from db.database import create_db_and_tables
create_db_and_tables()

# Clase de sesión para SmartTrade (se mantiene)
class SmartTradeSession:
    def __init__(self):
        self.sessions = {}

    def create_session(self, user_id, symbol, config):
        self.sessions[user_id] = {"symbol": symbol, "config": config}
        return self.sessions[user_id]

    def get_session(self, user_id):
        return self.sessions.get(user_id)

# Instancia global (se mantiene)
smart_trade_session = SmartTradeSession()

# Cargar .env
load_dotenv()

app = FastAPI()

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Puedes restringir esto según sea necesario
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates
templates = Jinja2Templates(directory="templates")

# Rutas
app.include_router(bots.router)  # 📈 SmartTrade + Backtest (incluye /api/ en las rutas)
app.include_router(smart_trade_router, prefix="/api")
app.include_router(symbols_router, prefix="/api")
app.include_router(testnet_router, prefix="/testnet")
app.include_router(bot_routes.router)  # 🤖 Gestión de bots (CRUD)

@app.get("/")
def root():
    return {"message": "InteliBotX API running ✅"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)