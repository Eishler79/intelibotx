"""
User Exchange Models - InteliBotX
Modelos para gestión de exchanges por usuario
"""

from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
import json


class UserExchange(SQLModel, table=True):
    """Modelo para exchanges configurados por usuario"""
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, description="ID del usuario propietario")
    
    # Exchange Info
    exchange_name: str = Field(description="Nombre del exchange (binance, bybit, okx, etc.)")
    connection_name: str = Field(description="Nombre personalizado (ej. 'Mi Binance Principal')")
    
    # Encrypted API Credentials
    encrypted_api_key: Optional[str] = Field(default=None, description="API Key encriptada")
    encrypted_api_secret: Optional[str] = Field(default=None, description="API Secret encriptada")
    encrypted_passphrase: Optional[str] = Field(default=None, description="Passphrase encriptada (para OKX, etc.)")
    
    # Exchange Configuration  
    is_testnet: bool = Field(description="Si es testnet o mainnet - REQUERIDO por usuario")
    permissions: Optional[str] = Field(default=None, description="Permisos JSON (spot, futures, margin)")
    
    # Connection Status
    status: str = Field(default="inactive", description="active, inactive, error")
    last_test_at: Optional[datetime] = Field(default=None, description="Última prueba de conexión")
    error_message: Optional[str] = Field(default=None, description="Último error de conexión")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Fecha de creación")
    updated_at: Optional[datetime] = Field(default=None, description="Fecha de última actualización")
    
    # Helper methods
    def get_permissions(self) -> Dict[str, Any]:
        """Obtener permisos parseados"""
        if self.permissions:
            try:
                return json.loads(self.permissions)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def set_permissions(self, permissions_dict: Dict[str, Any]) -> None:
        """Establecer permisos desde diccionario"""
        self.permissions = json.dumps(permissions_dict)
    
    def update_timestamp(self) -> None:
        """Actualizar timestamp de modificación"""
        self.updated_at = datetime.utcnow()


class ExchangeConnectionRequest(SQLModel):
    """Request model para conectar exchange"""
    
    exchange_name: str = Field(description="Nombre del exchange")
    connection_name: str = Field(description="Nombre personalizado de la conexión")
    api_key: str = Field(description="API Key del exchange")
    api_secret: str = Field(description="API Secret del exchange")
    passphrase: Optional[str] = Field(default=None, description="Passphrase (para OKX)")
    is_testnet: bool = Field(description="Si es testnet - REQUERIDO por usuario")


class ExchangeConnectionResponse(SQLModel):
    """Response model para exchange conectado"""
    
    id: int
    exchange_name: str
    connection_name: str
    is_testnet: bool
    status: str
    permissions: Optional[Dict[str, Any]] = None
    last_test_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime


class ExchangeTestResponse(SQLModel):
    """Response model para test de conexión"""
    
    success: bool
    exchange_name: str
    connection_name: str
    account_info: Optional[Dict[str, Any]] = None
    balance_info: Optional[Dict[str, Any]] = None
    permissions: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    tested_at: datetime = Field(default_factory=datetime.utcnow)