### 📁 backend/models/user.py
from sqlmodel import SQLModel, Field
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any
from datetime import datetime
import json

class User(SQLModel, table=True):
    """
    Modelo para usuarios del sistema InteliBotX.
    Cada usuario tiene sus propias claves API de Binance encriptadas.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Información básica del usuario
    email: str = Field(unique=True, index=True, description="Email único del usuario")
    password_hash: str = Field(description="Hash bcrypt de la contraseña")
    full_name: Optional[str] = Field(default=None, description="Nombre completo del usuario")
    
    # Configuración de Exchange (encriptada)
    encrypted_binance_testnet_key: Optional[str] = Field(default=None, description="API Key testnet encriptada")
    encrypted_binance_testnet_secret: Optional[str] = Field(default=None, description="API Secret testnet encriptada")
    encrypted_binance_mainnet_key: Optional[str] = Field(default=None, description="API Key mainnet encriptada") 
    encrypted_binance_mainnet_secret: Optional[str] = Field(default=None, description="API Secret mainnet encriptada")
    
    # Preferencias del usuario
    preferred_exchange: str = Field(default="BINANCE", description="Exchange preferido")
    preferred_mode: str = Field(default="TESTNET", description="TESTNET o MAINNET")
    default_market_type: str = Field(default="SPOT", description="Tipo de mercado por defecto")
    
    # Configuración de seguridad
    two_factor_enabled: bool = Field(default=False, description="2FA habilitado")
    api_keys_configured: bool = Field(default=False, description="Claves API configuradas")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    last_login_at: Optional[datetime] = Field(default=None)
    
    # Estado del usuario
    is_active: bool = Field(default=True, description="Usuario activo")
    is_verified: bool = Field(default=False, description="Email verificado")
    
    @validator('preferred_mode')
    def validate_preferred_mode(cls, v):
        if v not in ['TESTNET', 'MAINNET']:
            raise ValueError('preferred_mode must be TESTNET or MAINNET')
        return v
    
    @validator('default_market_type')
    def validate_market_type(cls, v):
        valid_types = ['SPOT', 'FUTURES_USDT', 'FUTURES_COIN', 'MARGIN_CROSS', 'MARGIN_ISOLATED']
        if v not in valid_types:
            raise ValueError(f'default_market_type must be one of {valid_types}')
        return v


class UserSession(SQLModel, table=True):
    """
    Modelo para gestión de sesiones de usuario con JWT.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    # Token JWT y metadata
    token_jti: str = Field(unique=True, description="JWT ID único")
    refresh_token: Optional[str] = Field(default=None, description="Token de refrescado")
    
    # Información de la sesión
    ip_address: Optional[str] = Field(default=None, description="IP del usuario")
    user_agent: Optional[str] = Field(default=None, description="Browser info")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(description="Expiración de la sesión")
    last_used_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Estado
    is_active: bool = Field(default=True, description="Sesión activa")
    revoked: bool = Field(default=False, description="Token revocado")


# Schemas para request/response
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    preferred_exchange: str
    preferred_mode: str
    default_market_type: str
    api_keys_configured: bool
    is_active: bool
    created_at: datetime

class ApiKeysUpdate(BaseModel):
    testnet_key: Optional[str] = None
    testnet_secret: Optional[str] = None
    mainnet_key: Optional[str] = None
    mainnet_secret: Optional[str] = None
    preferred_mode: str = "TESTNET"

from pydantic import BaseModel