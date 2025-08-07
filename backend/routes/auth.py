### 📁 backend/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import Dict, Any

from db.database import get_session
from models.user import UserCreate, UserLogin, UserResponse, ApiKeysUpdate
from services.auth_service import auth_service, get_current_user
from models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Dict[str, Any])
async def register(
    user_data: UserCreate,
    session: Session = Depends(get_session)
):
    """
    Registrar nuevo usuario en InteliBotX.
    
    Crea una cuenta nueva y retorna token de acceso.
    """
    try:
        # Crear usuario
        user = auth_service.register_user(user_data, session)
        
        # Generar token JWT
        token_data = auth_service.create_jwt_token(user.id, user.email)
        
        return {
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "created_at": user.created_at.isoformat()
            },
            "auth": token_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Dict[str, Any])
async def login(
    login_data: UserLogin,
    session: Session = Depends(get_session)
):
    """
    Iniciar sesión en InteliBotX.
    
    Autentica usuario y retorna token de acceso.
    """
    try:
        # Autenticar usuario
        user = auth_service.authenticate_user(login_data, session)
        
        # Generar token JWT
        token_data = auth_service.create_jwt_token(user.id, user.email)
        
        return {
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "preferred_exchange": user.preferred_exchange,
                "preferred_mode": user.preferred_mode,
                "api_keys_configured": user.api_keys_configured,
                "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None
            },
            "auth": token_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Obtener información del usuario autenticado actual.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        preferred_exchange=current_user.preferred_exchange,
        preferred_mode=current_user.preferred_mode,
        default_market_type=current_user.default_market_type,
        api_keys_configured=current_user.api_keys_configured,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.put("/api-keys", response_model=Dict[str, str])
async def update_api_keys(
    api_keys_data: ApiKeysUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Actualizar claves API de Binance del usuario.
    
    Las claves se encriptan antes de almacenarse en la base de datos.
    """
    try:
        # Convertir a dict
        keys_dict = api_keys_data.dict(exclude_unset=True)
        
        # Actualizar usuario
        updated_user = auth_service.update_user_api_keys(
            current_user.id, keys_dict, session
        )
        
        return {
            "message": "API keys updated successfully",
            "preferred_mode": updated_user.preferred_mode,
            "api_keys_configured": str(updated_user.api_keys_configured)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update API keys: {str(e)}"
        )

@router.get("/binance-status", response_model=Dict[str, Any])
async def check_binance_status(
    current_user: User = Depends(get_current_user)
):
    """
    Verificar estado de configuración de Binance para el usuario.
    """
    return {
        "api_keys_configured": current_user.api_keys_configured,
        "preferred_mode": current_user.preferred_mode,
        "preferred_exchange": current_user.preferred_exchange,
        "has_testnet_keys": bool(
            current_user.encrypted_binance_testnet_key and 
            current_user.encrypted_binance_testnet_secret
        ),
        "has_mainnet_keys": bool(
            current_user.encrypted_binance_mainnet_key and 
            current_user.encrypted_binance_mainnet_secret
        )
    }

@router.post("/test-binance-connection", response_model=Dict[str, Any])
async def test_binance_connection(
    current_user: User = Depends(get_current_user)
):
    """
    Probar conexión REAL con Binance usando las claves del usuario.
    Solo para testnet por seguridad.
    """
    try:
        # Obtener credenciales testnet del usuario
        credentials = auth_service.get_user_binance_credentials(current_user, "TESTNET")
        
        if not credentials or not credentials.get("api_key") or not credentials.get("api_secret"):
            return {
                "connection_status": "error",
                "mode": "TESTNET",
                "message": "No testnet API keys configured for user",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Usar BinanceService REAL para test
        from services.binance_service import validate_binance_credentials
        
        # Validar credenciales reales
        validation_result = await validate_binance_credentials(
            credentials["api_key"], 
            credentials["api_secret"], 
            testnet=True
        )
        
        # Agregar timestamp
        validation_result["timestamp"] = datetime.utcnow().isoformat()
        
        return validation_result
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "connection_status": "error",
            "mode": "TESTNET", 
            "message": f"Connection test failed: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }

@router.get("/binance-account", response_model=Dict[str, Any])
async def get_binance_account_info(
    current_user: User = Depends(get_current_user)
):
    """
    Obtener información REAL de la cuenta Binance del usuario.
    """
    try:
        # Obtener credenciales testnet del usuario
        credentials = auth_service.get_user_binance_credentials(current_user, "TESTNET")
        
        if not credentials or not credentials.get("api_key") or not credentials.get("api_secret"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No testnet API keys configured"
            )
        
        # Crear servicio Binance
        from services.binance_service import BinanceService
        
        binance_service = BinanceService(
            credentials["api_key"], 
            credentials["api_secret"], 
            testnet=True
        )
        
        # Obtener información de cuenta real
        account_info = await binance_service.get_account_info()
        
        return account_info
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get account info: {str(e)}"
        )

@router.get("/binance-price/{symbol}", response_model=Dict[str, Any])
async def get_binance_price(
    symbol: str,
    current_user: User = Depends(get_current_user)
):
    """
    Obtener precio REAL de un símbolo desde Binance.
    """
    try:
        # Obtener credenciales testnet del usuario
        credentials = auth_service.get_user_binance_credentials(current_user, "TESTNET")
        
        if not credentials or not credentials.get("api_key") or not credentials.get("api_secret"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No testnet API keys configured"
            )
        
        # Crear servicio Binance
        from services.binance_service import BinanceService
        
        binance_service = BinanceService(
            credentials["api_key"], 
            credentials["api_secret"], 
            testnet=True
        )
        
        # Obtener precio real + estadísticas 24h
        price_result = await binance_service.get_symbol_price(symbol.upper())
        ticker_result = await binance_service.get_24hr_ticker(symbol.upper())
        
        # Combinar resultados
        if price_result["status"] == "success" and ticker_result["status"] == "success":
            return {
                "status": "success",
                "symbol": symbol.upper(),
                "current_price": price_result["price"],
                "price_change_24h": ticker_result["price_change_percent"],
                "volume_24h": ticker_result["volume"],
                "high_24h": ticker_result["high_price"],
                "low_24h": ticker_result["low_price"],
                "source": "binance_testnet_authenticated",
                "timestamp": price_result["timestamp"]
            }
        else:
            # Return any error from price or ticker
            error_msg = price_result.get("message", "") or ticker_result.get("message", "")
            return {
                "status": "error",
                "message": error_msg,
                "symbol": symbol.upper()
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get price data: {str(e)}"
        )

@router.post("/logout", response_model=Dict[str, str])
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Cerrar sesión del usuario.
    
    En implementación completa se invalidaría el token JWT.
    """
    return {
        "message": "Logout successful",
        "timestamp": datetime.utcnow().isoformat()
    }

from datetime import datetime