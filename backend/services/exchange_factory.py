"""
Exchange Factory Service - InteliBotX
Factory pattern para manejar múltiples exchanges
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from binance.client import Client as BinanceClient
from binance.exceptions import BinanceAPIException
from services.encryption_service import EncryptionService

logger = logging.getLogger(__name__)


class ExchangeConnector:
    """Clase base para conectores de exchange"""
    
    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        self.api_key = api_key
        self.api_secret = api_secret
        self.testnet = testnet
        self.client = None
        
    def test_connection(self) -> Dict[str, Any]:
        """Test connection to exchange"""
        raise NotImplementedError("Must implement test_connection")
    
    def get_account_info(self) -> Dict[str, Any]:
        """Get account information"""
        raise NotImplementedError("Must implement get_account_info")
    
    def get_balance(self) -> Dict[str, Any]:
        """Get account balance"""
        raise NotImplementedError("Must implement get_balance")
    
    def get_price(self, symbol: str) -> float:
        """Get current price for symbol"""
        raise NotImplementedError("Must implement get_price")


class BinanceConnector(ExchangeConnector):
    """Binance exchange connector"""
    
    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        super().__init__(api_key, api_secret, testnet)
        
        # Configure Binance client
        if testnet:
            self.client = BinanceClient(
                api_key=api_key,
                api_secret=api_secret,
                testnet=True
            )
        else:
            self.client = BinanceClient(
                api_key=api_key,
                api_secret=api_secret
            )
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Binance connection"""
        try:
            # Test basic connectivity
            server_time = self.client.get_server_time()
            
            # Test API key permissions
            account_info = self.client.get_account()
            
            return {
                "success": True,
                "server_time": server_time,
                "account_type": account_info.get("accountType", "UNKNOWN"),
                "can_trade": account_info.get("canTrade", False),
                "can_withdraw": account_info.get("canWithdraw", False),
                "can_deposit": account_info.get("canDeposit", False),
                "permissions": account_info.get("permissions", [])
            }
            
        except BinanceAPIException as e:
            logger.error(f"Binance API error during connection test: {e}")
            return {
                "success": False,
                "error_code": getattr(e, 'code', 'UNKNOWN'),
                "error_message": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error during Binance connection test: {e}")
            return {
                "success": False,
                "error_message": str(e)
            }
    
    def get_account_info(self) -> Dict[str, Any]:
        """Get Binance account info"""
        try:
            account_info = self.client.get_account()
            return {
                "success": True,
                "data": account_info
            }
        except Exception as e:
            logger.error(f"Error getting Binance account info: {e}")
            return {
                "success": False,
                "error_message": str(e)
            }
    
    def get_balance(self) -> Dict[str, Any]:
        """Get Binance account balance"""
        try:
            account_info = self.client.get_account()
            balances = account_info.get("balances", [])
            
            # Filter non-zero balances
            non_zero_balances = []
            total_value_usdt = 0.0
            
            for balance in balances:
                free_amount = float(balance.get("free", 0))
                locked_amount = float(balance.get("locked", 0))
                total_amount = free_amount + locked_amount
                
                if total_amount > 0:
                    asset = balance.get("asset")
                    balance_info = {
                        "asset": asset,
                        "free": free_amount,
                        "locked": locked_amount,
                        "total": total_amount
                    }
                    
                    # Try to get USDT value (simplified for USDT)
                    if asset == "USDT":
                        balance_info["usdt_value"] = total_amount
                        total_value_usdt += total_amount
                    elif asset == "BTC":
                        # For BTC, we'd need to get the current price
                        try:
                            btc_price = self.get_price("BTCUSDT")
                            balance_info["usdt_value"] = total_amount * btc_price
                            total_value_usdt += balance_info["usdt_value"]
                        except:
                            balance_info["usdt_value"] = 0
                    else:
                        balance_info["usdt_value"] = 0
                    
                    non_zero_balances.append(balance_info)
            
            return {
                "success": True,
                "balances": non_zero_balances,
                "total_value_usdt": total_value_usdt,
                "balance_count": len(non_zero_balances)
            }
            
        except Exception as e:
            logger.error(f"Error getting Binance balance: {e}")
            return {
                "success": False,
                "error_message": str(e)
            }
    
    def get_price(self, symbol: str) -> float:
        """Get current price for Binance symbol"""
        try:
            ticker = self.client.get_symbol_ticker(symbol=symbol)
            return float(ticker.get("price", 0))
        except Exception as e:
            logger.error(f"Error getting Binance price for {symbol}: {e}")
            return 0.0


class BybitConnector(ExchangeConnector):
    """Bybit exchange connector (placeholder)"""
    
    def test_connection(self) -> Dict[str, Any]:
        return {
            "success": False,
            "error_message": "Bybit integration not implemented yet"
        }
    
    def get_account_info(self) -> Dict[str, Any]:
        return {"success": False, "error_message": "Not implemented"}
    
    def get_balance(self) -> Dict[str, Any]:
        return {"success": False, "error_message": "Not implemented"}
    
    def get_price(self, symbol: str) -> float:
        return 0.0


class OKXConnector(ExchangeConnector):
    """OKX exchange connector (placeholder)"""
    
    def test_connection(self) -> Dict[str, Any]:
        return {
            "success": False,
            "error_message": "OKX integration not implemented yet"
        }
    
    def get_account_info(self) -> Dict[str, Any]:
        return {"success": False, "error_message": "Not implemented"}
    
    def get_balance(self) -> Dict[str, Any]:
        return {"success": False, "error_message": "Not implemented"}
    
    def get_price(self, symbol: str) -> float:
        return 0.0


class ExchangeFactory:
    """Factory para crear conectores de exchange"""
    
    SUPPORTED_EXCHANGES = {
        "binance": BinanceConnector,
        "bybit": BybitConnector,
        "okx": OKXConnector,
    }
    
    def __init__(self, encryption_service: EncryptionService):
        self.encryption_service = encryption_service
    
    def create_connector(self, exchange_name: str, encrypted_api_key: str, 
                        encrypted_api_secret: str, testnet: bool = True) -> Optional[ExchangeConnector]:
        """Create exchange connector"""
        try:
            # Decrypt credentials
            api_key = self.encryption_service.decrypt_api_key(encrypted_api_key)
            api_secret = self.encryption_service.decrypt_api_key(encrypted_api_secret)
            
            if not api_key or not api_secret:
                logger.error(f"Failed to decrypt credentials for {exchange_name}")
                return None
            
            # Get connector class
            exchange_name_lower = exchange_name.lower()
            if exchange_name_lower not in self.SUPPORTED_EXCHANGES:
                logger.error(f"Exchange {exchange_name} not supported")
                return None
            
            connector_class = self.SUPPORTED_EXCHANGES[exchange_name_lower]
            return connector_class(api_key, api_secret, testnet)
            
        except Exception as e:
            logger.error(f"Error creating connector for {exchange_name}: {e}")
            return None
    
    @classmethod
    def get_supported_exchanges(cls) -> List[str]:
        """Get list of supported exchanges"""
        return list(cls.SUPPORTED_EXCHANGES.keys())
    
    @classmethod
    def is_exchange_supported(cls, exchange_name: str) -> bool:
        """Check if exchange is supported"""
        return exchange_name.lower() in cls.SUPPORTED_EXCHANGES