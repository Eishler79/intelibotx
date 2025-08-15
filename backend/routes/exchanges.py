"""
Exchange Management Routes - InteliBotX
Rutas para gestión de exchanges por usuario
"""

import logging
from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Header

# Lazy imports to avoid psycopg2 dependency at module level

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user", tags=["exchanges"])



@router.get("/exchanges")
async def list_user_exchanges(authorization: str = Header(None)):
    """Listar exchanges del usuario"""
    # Lazy imports
    from models.user import User
    from models.user_exchange import UserExchange, ExchangeConnectionResponse
    from services.auth_service import auth_service
    from db.database import get_session
    from sqlmodel import Session, select
    from fastapi import HTTPException, status
    
    # Manual authentication - Opción B con estándares de seguridad
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    
    # Extract and validate JWT token using existing service methods
    try:
        token = auth_service.get_token_from_header(authorization)
        token_data = auth_service.verify_jwt_token(token)
        
        # Get database session and user
        session = get_session()
        current_user = auth_service.get_user_by_id(token_data["user_id"], session)
        
        if not current_user or not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error in list_user_exchanges: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication"
        )
    
    try:
        statement = select(UserExchange).where(UserExchange.user_id == current_user.id)
        exchanges = session.exec(statement).all()
        
        response_exchanges = []
        for exchange in exchanges:
            exchange_response = ExchangeConnectionResponse(
                id=exchange.id,
                exchange_name=exchange.exchange_name,
                connection_name=exchange.connection_name,
                is_testnet=exchange.is_testnet,
                status=exchange.status,
                permissions=exchange.get_permissions(),
                last_test_at=exchange.last_test_at,
                error_message=exchange.error_message,
                created_at=exchange.created_at
            )
            response_exchanges.append(exchange_response)
        
        return response_exchanges
        
    except Exception as e:
        logger.error(f"Error listing user exchanges: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list exchanges"
        )


@router.post("/exchanges")
async def add_user_exchange(
    exchange_request: dict,
    authorization: str = Header(None)
):
    """Agregar nuevo exchange para usuario"""
    # Lazy imports
    from models.user import User
    from models.user_exchange import UserExchange, ExchangeConnectionRequest, ExchangeConnectionResponse
    from services.auth_service import auth_service
    from db.database import get_session
    from sqlmodel import Session, select
    from services.encryption_service import EncryptionService
    from services.exchange_factory import ExchangeFactory
    from fastapi import HTTPException, status
    
    # Manual authentication - Opción B con estándares de seguridad
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    
    # Extract and validate JWT token using existing service methods
    try:
        token = auth_service.get_token_from_header(authorization)
        token_data = auth_service.verify_jwt_token(token)
        
        # Get database session and user
        session = get_session()
        current_user = auth_service.get_user_by_id(token_data["user_id"], session)
        
        if not current_user or not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error in add_user_exchange: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication"
        )
    
    # Initialize services
    encryption_service = EncryptionService()
    exchange_factory = ExchangeFactory(encryption_service)
    
    try:
        # Validate exchange is supported
        if not exchange_factory.is_exchange_supported(exchange_request.exchange_name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Exchange {exchange_request.exchange_name} is not supported"
            )
        
        # Check if connection name already exists for user
        existing_statement = select(UserExchange).where(
            UserExchange.user_id == current_user.id,
            UserExchange.connection_name == exchange_request.connection_name
        )
        existing_exchange = session.exec(existing_statement).first()
        if existing_exchange:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Connection name '{exchange_request.connection_name}' already exists"
            )
        
        # Encrypt credentials
        encrypted_api_key = encryption_service.encrypt_api_key(exchange_request.api_key)
        encrypted_api_secret = encryption_service.encrypt_api_key(exchange_request.api_secret)
        
        if not encrypted_api_key or not encrypted_api_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to encrypt API credentials"
            )
        
        # Encrypt passphrase if provided
        encrypted_passphrase = None
        if exchange_request.passphrase:
            encrypted_passphrase = encryption_service.encrypt_api_key(exchange_request.passphrase)
        
        # Create UserExchange record
        user_exchange = UserExchange(
            user_id=current_user.id,
            exchange_name=exchange_request.exchange_name.lower(),
            connection_name=exchange_request.connection_name,
            encrypted_api_key=encrypted_api_key,
            encrypted_api_secret=encrypted_api_secret,
            encrypted_passphrase=encrypted_passphrase,
            is_testnet=exchange_request.is_testnet,
            status="inactive"  # Will be updated after connection test
        )
        
        session.add(user_exchange)
        session.commit()
        session.refresh(user_exchange)
        
        # Test connection immediately
        connector = exchange_factory.create_connector(
            user_exchange.exchange_name,
            user_exchange.encrypted_api_key,
            user_exchange.encrypted_api_secret,
            user_exchange.is_testnet
        )
        
        if connector:
            test_result = connector.test_connection()
            if test_result.get("success"):
                user_exchange.status = "active"
                if test_result.get("permissions"):
                    user_exchange.set_permissions({
                        "can_trade": test_result.get("can_trade", False),
                        "can_withdraw": test_result.get("can_withdraw", False),
                        "can_deposit": test_result.get("can_deposit", False),
                        "permissions": test_result.get("permissions", [])
                    })
            else:
                user_exchange.status = "error"
                user_exchange.error_message = test_result.get("error_message", "Connection test failed")
            
            user_exchange.last_test_at = datetime.utcnow()
            session.commit()
        
        # Return response
        return ExchangeConnectionResponse(
            id=user_exchange.id,
            exchange_name=user_exchange.exchange_name,
            connection_name=user_exchange.connection_name,
            is_testnet=user_exchange.is_testnet,
            status=user_exchange.status,
            permissions=user_exchange.get_permissions(),
            last_test_at=user_exchange.last_test_at,
            error_message=user_exchange.error_message,
            created_at=user_exchange.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error adding user exchange: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add exchange: {str(e)}"
        )


@router.put("/exchanges/{exchange_id}")
async def update_user_exchange(
    exchange_id: int,
    exchange_request: dict
):
    """Actualizar exchange del usuario"""
    # Lazy imports
    from models.user import User
    from models.user_exchange import UserExchange, ExchangeConnectionRequest, ExchangeConnectionResponse
    from services.auth_service import get_current_user
    from db.database import get_session
    from sqlmodel import Session, select
    from services.encryption_service import EncryptionService
    
    # Get actual dependencies
    current_user = await get_current_user()
    session = get_session().__next__()
    
    # Initialize services
    encryption_service = EncryptionService()
    
    try:
        # Get existing exchange
        user_exchange = session.get(UserExchange, exchange_id)
        if not user_exchange or user_exchange.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange not found"
            )
        
        # Update fields
        user_exchange.exchange_name = exchange_request.exchange_name.lower()
        user_exchange.connection_name = exchange_request.connection_name
        user_exchange.is_testnet = exchange_request.is_testnet
        
        # Update credentials if provided
        if exchange_request.api_key:
            user_exchange.encrypted_api_key = encryption_service.encrypt_api_key(exchange_request.api_key)
        if exchange_request.api_secret:
            user_exchange.encrypted_api_secret = encryption_service.encrypt_api_key(exchange_request.api_secret)
        if exchange_request.passphrase:
            user_exchange.encrypted_passphrase = encryption_service.encrypt_api_key(exchange_request.passphrase)
        
        user_exchange.update_timestamp()
        session.commit()
        
        return ExchangeConnectionResponse(
            id=user_exchange.id,
            exchange_name=user_exchange.exchange_name,
            connection_name=user_exchange.connection_name,
            is_testnet=user_exchange.is_testnet,
            status=user_exchange.status,
            permissions=user_exchange.get_permissions(),
            last_test_at=user_exchange.last_test_at,
            error_message=user_exchange.error_message,
            created_at=user_exchange.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating user exchange: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update exchange"
        )


@router.delete("/exchanges/{exchange_id}")
async def delete_user_exchange(
    exchange_id: int
):
    """Eliminar exchange del usuario"""
    # Lazy imports
    from models.user import User
    from models.user_exchange import UserExchange
    from services.auth_service import get_current_user
    from db.database import get_session
    from sqlmodel import Session, select
    
    # Get actual dependencies
    current_user = await get_current_user()
    session = get_session().__next__()
    
    try:
        user_exchange = session.get(UserExchange, exchange_id)
        if not user_exchange or user_exchange.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange not found"
            )
        
        session.delete(user_exchange)
        session.commit()
        
        return {"message": "Exchange deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error deleting user exchange: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete exchange"
        )


@router.post("/exchanges/{exchange_id}/test")
async def test_exchange_connection(
    exchange_id: int
):
    """Probar conexión con exchange"""
    # Lazy imports
    from models.user import User
    from models.user_exchange import UserExchange, ExchangeTestResponse
    from services.auth_service import get_current_user
    from db.database import get_session
    from sqlmodel import Session, select
    from services.encryption_service import EncryptionService
    from services.exchange_factory import ExchangeFactory
    
    # Get actual dependencies
    current_user = await get_current_user()
    session = get_session().__next__()
    
    # Initialize services
    encryption_service = EncryptionService()
    exchange_factory = ExchangeFactory(encryption_service)
    
    try:
        user_exchange = session.get(UserExchange, exchange_id)
        if not user_exchange or user_exchange.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange not found"
            )
        
        # Create connector
        connector = exchange_factory.create_connector(
            user_exchange.exchange_name,
            user_exchange.encrypted_api_key,
            user_exchange.encrypted_api_secret,
            user_exchange.is_testnet
        )
        
        if not connector:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create exchange connector"
            )
        
        # Test connection
        test_result = connector.test_connection()
        
        # Update exchange status
        if test_result.get("success"):
            user_exchange.status = "active"
            user_exchange.error_message = None
            
            # Update permissions
            if test_result.get("permissions"):
                user_exchange.set_permissions({
                    "can_trade": test_result.get("can_trade", False),
                    "can_withdraw": test_result.get("can_withdraw", False),
                    "can_deposit": test_result.get("can_deposit", False),
                    "permissions": test_result.get("permissions", [])
                })
        else:
            user_exchange.status = "error"
            user_exchange.error_message = test_result.get("error_message", "Connection test failed")
        
        user_exchange.last_test_at = datetime.utcnow()
        session.commit()
        
        # Get additional info if connection successful
        account_info = None
        balance_info = None
        
        if test_result.get("success"):
            try:
                account_result = connector.get_account_info()
                if account_result.get("success"):
                    account_info = account_result.get("data")
                
                balance_result = connector.get_balance()
                if balance_result.get("success"):
                    balance_info = balance_result
                    
            except Exception as e:
                logger.warning(f"Error getting additional exchange info: {e}")
        
        return ExchangeTestResponse(
            success=test_result.get("success", False),
            exchange_name=user_exchange.exchange_name,
            connection_name=user_exchange.connection_name,
            account_info=account_info,
            balance_info=balance_info,
            permissions=user_exchange.get_permissions(),
            error_message=user_exchange.error_message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing exchange connection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test connection: {str(e)}"
        )


@router.get("/exchanges/{exchange_id}/balance")
async def get_exchange_balance(
    exchange_id: int
):
    """Obtener balance del exchange"""
    # Lazy imports
    from models.user import User
    from models.user_exchange import UserExchange
    from services.auth_service import get_current_user
    from db.database import get_session
    from sqlmodel import Session, select
    from services.encryption_service import EncryptionService
    from services.exchange_factory import ExchangeFactory
    
    # Get actual dependencies
    current_user = await get_current_user()
    session = get_session().__next__()
    
    # Initialize services
    encryption_service = EncryptionService()
    exchange_factory = ExchangeFactory(encryption_service)
    
    try:
        user_exchange = session.get(UserExchange, exchange_id)
        if not user_exchange or user_exchange.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange not found"
            )
        
        if user_exchange.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Exchange connection is not active"
            )
        
        # Create connector
        connector = exchange_factory.create_connector(
            user_exchange.exchange_name,
            user_exchange.encrypted_api_key,
            user_exchange.encrypted_api_secret,
            user_exchange.is_testnet
        )
        
        if not connector:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create exchange connector"
            )
        
        # Get balance
        balance_result = connector.get_balance()
        if not balance_result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=balance_result.get("error_message", "Failed to get balance")
            )
        
        return balance_result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting exchange balance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get exchange balance"
        )


@router.get("/exchanges/{exchange_id}/market-types")
async def get_exchange_market_types(
    exchange_id: int
):
    """
    Obtener tipos de mercado disponibles por exchange
    
    Cada exchange tiene diferentes tipos de mercado:
    - Binance: SPOT, FUTURES, MARGIN, LEVERAGED_TOKENS
    - ByBit: SPOT, LINEAR, INVERSE, OPTION
    - KuCoin: SPOT, FUTURES, MARGIN
    - OKX: SPOT, SWAP, FUTURES, OPTIONS
    """
    # Lazy imports
    from models.user import User
    from models.user_exchange import UserExchange
    from services.auth_service import get_current_user
    from db.database import get_session
    from sqlmodel import Session, select
    
    # Get actual dependencies
    current_user = await get_current_user()
    session = get_session().__next__()
    
    try:
        # Get user exchange
        user_exchange = session.get(UserExchange, exchange_id)
        if not user_exchange or user_exchange.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange not found"
            )
        
        # Market types by exchange
        exchange_market_types = {
            "binance": {
                "market_types": [
                    {
                        "value": "SPOT",
                        "label": "SPOT - Trading sin apalancamiento",
                        "description": "Trading tradicional sin apalancamiento",
                        "max_leverage": 1,
                        "supports_margin": False
                    },
                    {
                        "value": "FUTURES_USDT",
                        "label": "FUTURES USDT - Perpetuos USDT",
                        "description": "Contratos perpetuos liquidados en USDT",
                        "max_leverage": 125,
                        "supports_margin": True
                    },
                    {
                        "value": "FUTURES_COIN",
                        "label": "FUTURES COIN - Perpetuos Coin",
                        "description": "Contratos perpetuos liquidados en cripto",
                        "max_leverage": 125,
                        "supports_margin": True
                    },
                    {
                        "value": "MARGIN",
                        "label": "MARGIN - Trading con margen",
                        "description": "Trading con margen cross/isolated",
                        "max_leverage": 10,
                        "supports_margin": True
                    }
                ]
            },
            "bybit": {
                "market_types": [
                    {
                        "value": "SPOT",
                        "label": "SPOT - Trading sin apalancamiento",
                        "description": "Trading tradicional sin apalancamiento",
                        "max_leverage": 1,
                        "supports_margin": False
                    },
                    {
                        "value": "LINEAR",
                        "label": "LINEAR - Perpetuos USDT",
                        "description": "Contratos perpetuos lineales USDT",
                        "max_leverage": 100,
                        "supports_margin": True
                    },
                    {
                        "value": "INVERSE",
                        "label": "INVERSE - Perpetuos Inversos",
                        "description": "Contratos perpetuos inversos",
                        "max_leverage": 100,
                        "supports_margin": True
                    },
                    {
                        "value": "OPTION",
                        "label": "OPTION - Opciones",
                        "description": "Trading de opciones",
                        "max_leverage": 1,
                        "supports_margin": False
                    }
                ]
            },
            "kucoin": {
                "market_types": [
                    {
                        "value": "SPOT",
                        "label": "SPOT - Trading sin apalancamiento",
                        "description": "Trading tradicional sin apalancamiento",
                        "max_leverage": 1,
                        "supports_margin": False
                    },
                    {
                        "value": "FUTURES",
                        "label": "FUTURES - Contratos Futuros",
                        "description": "Contratos de futuros con apalancamiento",
                        "max_leverage": 100,
                        "supports_margin": True
                    },
                    {
                        "value": "MARGIN",
                        "label": "MARGIN - Trading con margen",
                        "description": "Trading con margen",
                        "max_leverage": 10,
                        "supports_margin": True
                    }
                ]
            },
            "okx": {
                "market_types": [
                    {
                        "value": "SPOT",
                        "label": "SPOT - Trading sin apalancamiento",
                        "description": "Trading tradicional sin apalancamiento",
                        "max_leverage": 1,
                        "supports_margin": False
                    },
                    {
                        "value": "SWAP",
                        "label": "SWAP - Perpetuos",
                        "description": "Contratos perpetuos",
                        "max_leverage": 125,
                        "supports_margin": True
                    },
                    {
                        "value": "FUTURES",
                        "label": "FUTURES - Contratos Futuros",
                        "description": "Contratos de futuros con vencimiento",
                        "max_leverage": 125,
                        "supports_margin": True
                    },
                    {
                        "value": "OPTIONS",
                        "label": "OPTIONS - Opciones",
                        "description": "Trading de opciones",
                        "max_leverage": 1,
                        "supports_margin": False
                    }
                ]
            }
        }
        
        # Get market types for exchange
        exchange_name = user_exchange.exchange_name.lower()
        market_types_data = exchange_market_types.get(exchange_name)
        
        if not market_types_data:
            # Fallback para exchanges no mapeados
            market_types_data = exchange_market_types["binance"]
            logger.warning(f"Market types not mapped for {exchange_name}, using Binance fallback")
        
        return {
            "success": True,
            "exchange_id": exchange_id,
            "exchange_name": user_exchange.exchange_name,
            "is_testnet": user_exchange.is_testnet,
            "market_types": market_types_data["market_types"],
            "total_types": len(market_types_data["market_types"])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting market types for exchange {exchange_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get market types"
        )