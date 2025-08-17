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
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from models.user_exchange import UserExchange, ExchangeConnectionResponse
    from services.auth_service import get_current_user_safe
    from db.database import get_session
    from sqlmodel import Session, select
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
    try:
        session = get_session()
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
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from models.user_exchange import UserExchange, ExchangeConnectionRequest, ExchangeConnectionResponse
    from services.auth_service import get_current_user_safe
    from db.database import get_session
    from sqlmodel import Session, select
    from services.encryption_service import EncryptionService
    from services.exchange_factory import ExchangeFactory
    from fastapi import HTTPException, status
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
    # Initialize services
    encryption_service = EncryptionService()
    exchange_factory = ExchangeFactory(encryption_service)
    
    try:
        # Validate exchange is supported
        if not exchange_factory.is_exchange_supported(exchange_request.get("exchange_name")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Exchange {exchange_request.get('exchange_name')} is not supported"
            )
        
        # Check if connection name already exists for user
        existing_statement = select(UserExchange).where(
            UserExchange.user_id == current_user.id,
            UserExchange.connection_name == exchange_request.get("connection_name")
        )
        existing_exchange = session.exec(existing_statement).first()
        if existing_exchange:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Connection name '{exchange_request.get('connection_name')}' already exists"
            )
        
        # Encrypt credentials
        encrypted_api_key = encryption_service.encrypt_api_key(exchange_request.get("api_key"))
        encrypted_api_secret = encryption_service.encrypt_api_key(exchange_request.get("api_secret"))
        
        if not encrypted_api_key or not encrypted_api_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to encrypt API credentials"
            )
        
        # Encrypt passphrase if provided
        encrypted_passphrase = None
        if exchange_request.get("passphrase"):
            encrypted_passphrase = encryption_service.encrypt_api_key(exchange_request.get("passphrase"))
        
        # Create UserExchange record
        user_exchange = UserExchange(
            user_id=current_user.id,
            exchange_name=exchange_request.get("exchange_name").lower(),
            connection_name=exchange_request.get("connection_name"),
            encrypted_api_key=encrypted_api_key,
            encrypted_api_secret=encrypted_api_secret,
            encrypted_passphrase=encrypted_passphrase,
            is_testnet=exchange_request.get("is_testnet", False),
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
    exchange_request: dict,
    authorization: str = Header(None)
):
    """Actualizar exchange del usuario"""
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from models.user_exchange import UserExchange, ExchangeConnectionRequest, ExchangeConnectionResponse
    from services.auth_service import get_current_user_safe
    from db.database import get_session
    from sqlmodel import Session, select
    from services.encryption_service import EncryptionService
    from fastapi import HTTPException, status
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
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
        user_exchange.exchange_name = exchange_request.get("exchange_name").lower()
        user_exchange.connection_name = exchange_request.get("connection_name")
        user_exchange.is_testnet = exchange_request.get("is_testnet", False)
        
        # Update credentials if provided
        if exchange_request.get("api_key"):
            user_exchange.encrypted_api_key = encryption_service.encrypt_api_key(exchange_request.get("api_key"))
        if exchange_request.get("api_secret"):
            user_exchange.encrypted_api_secret = encryption_service.encrypt_api_key(exchange_request.get("api_secret"))
        if exchange_request.get("passphrase"):
            user_exchange.encrypted_passphrase = encryption_service.encrypt_api_key(exchange_request.get("passphrase"))
        
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
    exchange_id: int,
    authorization: str = Header(None)
):
    """Eliminar exchange del usuario"""
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from models.user_exchange import UserExchange
    from services.auth_service import get_current_user_safe
    from db.database import get_session
    from sqlmodel import Session, select
    from fastapi import HTTPException, status
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
    try:
        user_exchange = session.get(UserExchange, exchange_id)
        if not user_exchange or user_exchange.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange not found"
            )
        
        # ✅ VALIDAR: No se puede eliminar exchange que tiene bots asociados
        from models.bot_config import BotConfig
        
        # Verificar si hay bots usando este exchange
        bots_query = select(BotConfig).where(BotConfig.exchange_id == exchange_id)
        associated_bots = session.exec(bots_query).all()
        
        if associated_bots:
            bot_names = [bot.name for bot in associated_bots[:3]]  # Mostrar máximo 3 nombres
            bot_list = ", ".join(bot_names)
            if len(associated_bots) > 3:
                bot_list += f" y {len(associated_bots) - 3} más"
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede eliminar el exchange. Está siendo usado por {len(associated_bots)} bot(s): {bot_list}. Elimina primero los bots asociados."
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
    exchange_id: int,
    authorization: str = Header(None)
):
    """Probar conexión con exchange"""
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from models.user_exchange import UserExchange, ExchangeTestResponse
    from services.auth_service import get_current_user_safe
    from db.database import get_session
    from sqlmodel import Session, select
    from services.encryption_service import EncryptionService
    from services.exchange_factory import ExchangeFactory
    from fastapi import HTTPException, status
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
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
    exchange_id: int,
    authorization: str = Header(None)
):
    """Obtener balance del exchange"""
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from models.user_exchange import UserExchange
    from services.auth_service import get_current_user_safe
    from db.database import get_session
    from sqlmodel import Session, select
    from services.encryption_service import EncryptionService
    from services.exchange_factory import ExchangeFactory
    from fastapi import HTTPException, status
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
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
    exchange_id: int,
    authorization: str = Header(None)
):
    """
    Obtener tipos de mercado disponibles por exchange
    
    Cada exchange tiene diferentes tipos de mercado:
    - Binance: SPOT, FUTURES, MARGIN, LEVERAGED_TOKENS
    - ByBit: SPOT, LINEAR, INVERSE, OPTION
    - KuCoin: SPOT, FUTURES, MARGIN
    - OKX: SPOT, SWAP, FUTURES, OPTIONS
    """
    # DL-003: Lazy imports to avoid psycopg2 dependency at module level
    from models.user_exchange import UserExchange
    from services.auth_service import get_current_user_safe
    from db.database import get_session
    from sqlmodel import Session, select
    from fastapi import HTTPException, status
    
    # DL-003 COMPLIANT: Authentication via dependency function
    current_user = await get_current_user_safe(authorization)
    
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