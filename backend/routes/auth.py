### 📁 backend/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel import Session
from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Lazy imports to avoid psycopg2 dependency at module level

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Dict[str, Any])
async def register(
    user_data: dict,
    session = Depends(lambda: None)
):
    # Lazy imports
    from db.database import get_session
    from models.user import UserCreate, User
    from services.auth_service import auth_service
    from services.email_service import email_service
    from sqlmodel import Session
    
    # Get actual session
    session = get_session()
    
    # Convert dict to UserCreate
    user_data = UserCreate(**user_data)
    """
    Registrar nuevo usuario en InteliBotX.
    
    Crea una cuenta nueva y retorna token de acceso.
    """
    try:
        # Crear usuario
        user = auth_service.register_user(user_data, session)
        
        # Enviar email de verificación
        email_sent = await email_service.send_verification_email(
            user.email, 
            user.full_name or "User", 
            user.verification_token
        )
        
        if not email_sent:
            logger.warning(f"Failed to send verification email to {user.email}")
        
        return {
            "message": "User registered successfully. Please check your email to verify your account.",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat()
            },
            "verification_required": True,
            "email_sent": email_sent
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
    login_data: dict,
    session = Depends(lambda: None)
):
    """
    Iniciar sesión en InteliBotX.
    
    Autentica usuario y retorna token de acceso.
    """
    # Lazy imports
    from db.database import get_session
    from models.user import UserLogin
    from services.auth_service import auth_service
    from sqlmodel import Session
    
    # Get actual session
    session = get_session()
    
    # Convert dict to UserLogin
    login_data = UserLogin(**login_data)
    
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

@router.get("/me")
async def get_current_user_info(authorization: str = Header(None)):
    """
    Obtener información del usuario autenticado actual.
    """
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from models.user import UserResponse
    from services.auth_service import get_current_user_safe
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
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
    api_keys_data: dict,
    authorization: str = Header(None)
):
    """
    Actualizar claves API de Binance del usuario.
    
    Las claves se encriptan antes de almacenarse en la base de datos.
    """
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from models.user import ApiKeysUpdate
    from services.auth_service import get_current_user_safe
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
    # Convert dict to ApiKeysUpdate
    api_keys_data = ApiKeysUpdate(**api_keys_data)
    
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
async def check_binance_status(authorization: str = Header(None)):
    """
    Verificar estado de configuración de Binance para el usuario.
    """
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from services.auth_service import get_current_user_safe
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
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

# Exchange Management Endpoints

# ✅ DL-016: Exchange endpoints moved to /api/user/exchanges for REST API standards compliance
# See DECISION_LOG.md#DL-016 - routes/exchanges.py is the official exchange management endpoint

@router.post("/user/exchanges/{exchange_id}/test", response_model=Dict[str, Any])
async def test_user_exchange(
    exchange_id: int,
    authorization: str = Header(None)
):
    """
    Probar conexión de un exchange específico del usuario.
    """
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from services.auth_service import get_current_user_safe, auth_service
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
    try:
        # Determinar tipo de credenciales basado en ID
        mode = "TESTNET" if exchange_id == 1 else "MAINNET"
        
        credentials = auth_service.get_user_binance_credentials(current_user, mode)
        
        if not credentials or not credentials.get("api_key") or not credentials.get("api_secret"):
            return {
                "connection_status": "error",
                "mode": mode,
                "message": f"No {mode.lower()} API keys configured",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Usar BinanceService REAL para test
        from services.binance_service import validate_binance_credentials
        
        validation_result = await validate_binance_credentials(
            credentials["api_key"], 
            credentials["api_secret"], 
            testnet=(mode == "TESTNET")
        )
        
        validation_result["timestamp"] = datetime.utcnow().isoformat()
        return validation_result
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "connection_status": "error",
            "message": f"Test failed: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }

@router.post("/test-binance-connection", response_model=Dict[str, Any])
async def test_binance_connection(authorization: str = Header(None)):
    """
    Probar conexión REAL con Binance usando las claves del usuario.
    Solo para testnet por seguridad.
    """
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from services.auth_service import get_current_user_safe, auth_service
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
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
async def get_binance_account_info(authorization: str = Header(None)):
    """
    Obtener información REAL de la cuenta Binance del usuario.
    """
    # Lazy imports
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from services.auth_service import get_current_user_safe, auth_service
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
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
    authorization: str = Header(None)
):
    """
    Obtener precio REAL de un símbolo desde Binance.
    """
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from services.auth_service import get_current_user_safe
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
    try:
        # Los precios de Binance son públicos, no requieren API keys del usuario
        import aiohttp
        import time
        
        # API pública de Binance para precios (no requiere autenticación)
        async with aiohttp.ClientSession() as session:
            # Obtener precio actual
            price_url = f"https://api.binance.com/api/v3/ticker/price?symbol={symbol.upper()}"
            async with session.get(price_url) as response:
                if response.status == 200:
                    price_data = await response.json()
                    current_price = float(price_data["price"])
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Symbol {symbol} not found on Binance"
                    )
            
            # Obtener estadísticas 24h
            ticker_url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={symbol.upper()}"
            async with session.get(ticker_url) as response:
                if response.status == 200:
                    ticker_data = await response.json()
                    price_change_24h = float(ticker_data["priceChangePercent"])
                    volume_24h = float(ticker_data["volume"])
                    high_24h = float(ticker_data["highPrice"])
                    low_24h = float(ticker_data["lowPrice"])
                else:
                    # Si falla ticker 24h, usar valores por defecto
                    price_change_24h = 0.0
                    volume_24h = 0.0
                    high_24h = current_price
                    low_24h = current_price
        
        # Retornar resultados combinados
        return {
            "status": "success",
            "symbol": symbol.upper(),
            "current_price": current_price,
            "price_change_24h": price_change_24h,
            "volume_24h": volume_24h,
            "high_24h": high_24h,
            "low_24h": low_24h,
            "source": "binance_public_api",
            "timestamp": int(time.time() * 1000)  # timestamp en milliseconds
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get price data: {str(e)}"
        )

@router.post("/verify-email", response_model=Dict[str, Any])
async def verify_email(
    token: str,
    session = Depends(lambda: None)
):
    """
    Verificar email del usuario usando token de verificación.
    """
    # Lazy imports
    from db.database import get_session
    from services.auth_service import auth_service
    from sqlmodel import Session
    
    # Get actual session
    session = get_session()
    
    try:
        user = auth_service.verify_email_token(token, session)
        
        # Generar token JWT después de verificación exitosa
        token_data = auth_service.create_jwt_token(user.id, user.email)
        
        return {
            "message": "Email verified successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_verified": user.is_verified,
                "verified_at": user.updated_at.isoformat()
            },
            "auth": token_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email verification failed: {str(e)}"
        )

@router.post("/resend-verification", response_model=Dict[str, Any])
async def resend_verification(
    email: str,
    session = Depends(lambda: None)
):
    """
    Reenviar email de verificación.
    """
    # Lazy imports
    from db.database import get_session
    from services.auth_service import auth_service
    from services.email_service import email_service
    from sqlmodel import Session
    
    # Get actual session
    session = get_session()
    
    try:
        user = auth_service.resend_verification_token(email, session)
        
        # Enviar nuevo email
        email_sent = await email_service.send_verification_email(
            user.email,
            user.full_name or "User",
            user.verification_token
        )
        
        return {
            "message": "Verification email sent" if email_sent else "Verification token generated (email service unavailable)",
            "email_sent": email_sent,
            "expires_in_hours": 24
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resend verification: {str(e)}"
        )

@router.post("/request-password-reset", response_model=Dict[str, Any])
async def request_password_reset(
    request_data: Dict[str, str],
    session = Depends(lambda: None)
):
    """
    Solicitar reset de contraseña.
    Envía email con enlace de recuperación.
    """
    # Lazy imports
    from db.database import get_session
    from services.auth_service import auth_service
    from services.email_service import email_service
    from sqlmodel import Session
    
    # Get actual session
    session = get_session()
    
    try:
        email = request_data.get("email")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required"
            )
        
        user = auth_service.request_password_reset(email, session)
        
        # Enviar email de reset
        email_sent = await email_service.send_password_reset_email(
            user.email,
            user.full_name or "User",
            user.reset_token
        )
        
        # Siempre retornar el mismo mensaje por seguridad
        return {
            "message": "If the email exists, a password reset link has been sent",
            "email_sent": email_sent,
            "expires_in_hours": 1
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Log error pero no revelar detalles al usuario
        logger.error(f"Password reset request error: {str(e)}")
        return {
            "message": "If the email exists, a password reset link has been sent",
            "email_sent": False,
            "expires_in_hours": 1
        }

@router.post("/reset-password", response_model=Dict[str, Any])
async def reset_password(
    reset_data: Dict[str, str],
    session = Depends(lambda: None)
):
    """
    Resetear contraseña usando token de recuperación.
    """
    # Lazy imports
    from db.database import get_session
    from services.auth_service import auth_service
    from sqlmodel import Session
    
    # Get actual session
    session = get_session()
    
    try:
        token = reset_data.get("token")
        new_password = reset_data.get("new_password")
        
        if not token or not new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token and new_password are required"
            )
        
        user = auth_service.reset_password(token, new_password, session)
        
        # Generar nuevo token JWT después del reset
        token_data = auth_service.create_jwt_token(user.id, user.email)
        
        return {
            "message": "Password reset successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "reset_at": user.updated_at.isoformat()
            },
            "auth": token_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(e)}"
        )

@router.post("/test-email-connection", response_model=Dict[str, Any])
async def test_email_connection():
    """
    Test email service connection (SendGrid SMTP).
    """
    try:
        # Lazy imports
        from services.email_service import email_service
        
        # Test connection
        connection_ok = email_service.test_connection()
        
        return {
            "status": "success" if connection_ok else "error",
            "smtp_configured": email_service.is_configured,
            "smtp_server": email_service.smtp_server,
            "smtp_port": email_service.smtp_port,
            "from_email": email_service.from_email,
            "connection_test": "passed" if connection_ok else "failed",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Email test failed: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }

@router.post("/logout", response_model=Dict[str, str])
async def logout(authorization: str = Header(None)):
    """
    Cerrar sesión del usuario.
    
    En implementación completa se invalidaría el token JWT.
    """
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from services.auth_service import get_current_user_safe
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
    return {
        "message": "Logout successful",
        "timestamp": datetime.utcnow().isoformat()
    }