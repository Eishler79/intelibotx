### 📁 backend/services/binance_service.py
import os
import hmac
import hashlib
import time
from typing import Dict, Any, List, Optional
import aiohttp
import asyncio
from urllib.parse import urlencode
import logging

logger = logging.getLogger(__name__)

class BinanceService:
    """
    Servicio real para conectar con Binance API (testnet y mainnet).
    Maneja autenticación, órdenes, precios y datos de mercado.
    """
    
    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        self.api_key = api_key
        self.api_secret = api_secret
        self.testnet = testnet
        
        # URLs base según modo
        if testnet:
            self.base_url = "https://testnet.binance.vision/api/v3"
            self.futures_url = "https://testnet.binancefuture.com/fapi/v1"
        else:
            self.base_url = "https://api.binance.com/api/v3"
            self.futures_url = "https://fapi.binance.com/fapi/v1"
    
    def _generate_signature(self, query_string: str) -> str:
        """Generar firma HMAC-SHA256 para autenticación."""
        return hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def _get_headers(self) -> Dict[str, str]:
        """Headers básicos para requests."""
        return {
            'X-MBX-APIKEY': self.api_key,
            'Content-Type': 'application/json'
        }
    
    async def test_connectivity(self) -> Dict[str, Any]:
        """
        Test de conectividad con Binance API.
        
        Returns:
            Dict con status de conexión
        """
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/ping"
                
                async with session.get(url) as response:
                    if response.status == 200:
                        return {
                            "status": "success",
                            "message": "Binance API connection successful",
                            "mode": "TESTNET" if self.testnet else "MAINNET",
                            "timestamp": int(time.time() * 1000)
                        }
                    else:
                        return {
                            "status": "error",
                            "message": f"API returned status {response.status}",
                            "mode": "TESTNET" if self.testnet else "MAINNET"
                        }
                        
        except Exception as e:
            logger.error(f"Binance connectivity test failed: {e}")
            return {
                "status": "error",
                "message": f"Connection failed: {str(e)}",
                "mode": "TESTNET" if self.testnet else "MAINNET"
            }
    
    async def get_account_info(self) -> Dict[str, Any]:
        """
        Obtener información de la cuenta Binance.
        
        Returns:
            Dict con datos de la cuenta (balances, status, etc.)
        """
        try:
            timestamp = int(time.time() * 1000)
            query_string = f"timestamp={timestamp}"
            signature = self._generate_signature(query_string)
            
            url = f"{self.base_url}/account?{query_string}&signature={signature}"
            headers = self._get_headers()
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "status": "success",
                            "account_type": data.get('accountType', 'SPOT'),
                            "can_trade": data.get('canTrade', False),
                            "can_withdraw": data.get('canWithdraw', False),
                            "can_deposit": data.get('canDeposit', False),
                            "balances": [
                                {
                                    "asset": balance["asset"],
                                    "free": float(balance["free"]),
                                    "locked": float(balance["locked"])
                                }
                                for balance in data.get('balances', [])
                                if float(balance["free"]) > 0 or float(balance["locked"]) > 0
                            ],
                            "mode": "TESTNET" if self.testnet else "MAINNET"
                        }
                    else:
                        error_text = await response.text()
                        return {
                            "status": "error",
                            "message": f"Failed to get account info: {error_text}",
                            "status_code": response.status
                        }
                        
        except Exception as e:
            logger.error(f"Failed to get account info: {e}")
            return {
                "status": "error",
                "message": f"Account info request failed: {str(e)}"
            }
    
    async def get_symbol_price(self, symbol: str) -> Dict[str, Any]:
        """
        Obtener precio actual de un símbolo.
        
        Args:
            symbol: Par de trading (ej. BTCUSDT)
            
        Returns:
            Dict con precio actual
        """
        try:
            url = f"{self.base_url}/ticker/price?symbol={symbol}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "status": "success",
                            "symbol": data["symbol"],
                            "price": float(data["price"]),
                            "timestamp": int(time.time() * 1000),
                            "source": "binance_" + ("testnet" if self.testnet else "mainnet")
                        }
                    else:
                        return {
                            "status": "error",
                            "message": f"Failed to get price for {symbol}",
                            "status_code": response.status
                        }
                        
        except Exception as e:
            logger.error(f"Failed to get price for {symbol}: {e}")
            return {
                "status": "error",
                "message": f"Price request failed: {str(e)}"
            }
    
    async def get_24hr_ticker(self, symbol: str) -> Dict[str, Any]:
        """
        Obtener estadísticas de 24 horas para un símbolo.
        
        Returns:
            Dict con estadísticas completas
        """
        try:
            url = f"{self.base_url}/ticker/24hr?symbol={symbol}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            "status": "success",
                            "symbol": data["symbol"],
                            "price_change": float(data["priceChange"]),
                            "price_change_percent": float(data["priceChangePercent"]),
                            "last_price": float(data["lastPrice"]),
                            "volume": float(data["volume"]),
                            "quote_volume": float(data["quoteVolume"]),
                            "high_price": float(data["highPrice"]),
                            "low_price": float(data["lowPrice"]),
                            "open_price": float(data["openPrice"]),
                            "count": int(data["count"]),
                            "timestamp": int(time.time() * 1000),
                            "source": "binance_" + ("testnet" if self.testnet else "mainnet")
                        }
                    else:
                        return {
                            "status": "error",
                            "message": f"Failed to get 24hr ticker for {symbol}",
                            "status_code": response.status
                        }
                        
        except Exception as e:
            logger.error(f"Failed to get 24hr ticker for {symbol}: {e}")
            return {
                "status": "error", 
                "message": f"24hr ticker request failed: {str(e)}"
            }
    
    async def place_test_order(self, symbol: str, side: str, order_type: str, 
                              quantity: float, price: Optional[float] = None) -> Dict[str, Any]:
        """
        Colocar una orden de prueba (no se ejecuta realmente).
        
        Args:
            symbol: Par de trading
            side: BUY o SELL
            order_type: MARKET, LIMIT, etc.
            quantity: Cantidad a operar
            price: Precio (para órdenes LIMIT)
            
        Returns:
            Dict con resultado de la orden de prueba
        """
        try:
            timestamp = int(time.time() * 1000)
            
            params = {
                'symbol': symbol,
                'side': side,
                'type': order_type,
                'quantity': str(quantity),
                'timestamp': timestamp
            }
            
            if price and order_type == 'LIMIT':
                params['price'] = str(price)
                params['timeInForce'] = 'GTC'  # Good Till Cancelled
            
            query_string = urlencode(params)
            signature = self._generate_signature(query_string)
            
            url = f"{self.base_url}/order/test"
            headers = self._get_headers()
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url, 
                    headers=headers,
                    data=f"{query_string}&signature={signature}"
                ) as response:
                    if response.status == 200:
                        return {
                            "status": "success",
                            "message": "Test order successful",
                            "order_data": {
                                "symbol": symbol,
                                "side": side,
                                "type": order_type,
                                "quantity": quantity,
                                "price": price,
                                "test_mode": True
                            },
                            "timestamp": timestamp
                        }
                    else:
                        error_text = await response.text()
                        return {
                            "status": "error",
                            "message": f"Test order failed: {error_text}",
                            "status_code": response.status
                        }
                        
        except Exception as e:
            logger.error(f"Test order failed: {e}")
            return {
                "status": "error",
                "message": f"Test order request failed: {str(e)}"
            }
    
    async def get_exchange_info(self, symbol: Optional[str] = None) -> Dict[str, Any]:
        """
        Obtener información del exchange y símbolos.
        
        Args:
            symbol: Símbolo específico (opcional)
            
        Returns:
            Dict con información del exchange
        """
        try:
            url = f"{self.base_url}/exchangeInfo"
            if symbol:
                url += f"?symbol={symbol}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if symbol:
                            # Info de símbolo específico
                            symbols = data.get('symbols', [])
                            if symbols:
                                symbol_info = symbols[0]
                                return {
                                    "status": "success",
                                    "symbol": symbol_info["symbol"],
                                    "base_asset": symbol_info["baseAsset"],
                                    "quote_asset": symbol_info["quoteAsset"],
                                    "status": symbol_info["status"],
                                    "filters": symbol_info.get("filters", []),
                                    "permissions": symbol_info.get("permissions", [])
                                }
                        else:
                            # Info general del exchange
                            return {
                                "status": "success",
                                "timezone": data.get("timezone"),
                                "server_time": data.get("serverTime"),
                                "symbols_count": len(data.get("symbols", [])),
                                "rate_limits": data.get("rateLimits", [])
                            }
                    else:
                        return {
                            "status": "error",
                            "message": "Failed to get exchange info",
                            "status_code": response.status
                        }
                        
        except Exception as e:
            logger.error(f"Failed to get exchange info: {e}")
            return {
                "status": "error",
                "message": f"Exchange info request failed: {str(e)}"
            }


# Factory function para crear instancia de servicio
def create_binance_service(api_key: str, api_secret: str, testnet: bool = True) -> BinanceService:
    """
    Factory function para crear instancia de BinanceService.
    
    Args:
        api_key: Clave API de Binance
        api_secret: Secreto API de Binance  
        testnet: True para testnet, False para mainnet
        
    Returns:
        Instancia configurada de BinanceService
    """
    return BinanceService(api_key, api_secret, testnet)

# Helper function para validar credenciales
async def validate_binance_credentials(api_key: str, api_secret: str, testnet: bool = True) -> Dict[str, Any]:
    """
    Validar credenciales de Binance haciendo test de conectividad.
    
    Returns:
        Dict con resultado de validación
    """
    try:
        service = BinanceService(api_key, api_secret, testnet)
        
        # Test conectividad básica
        ping_result = await service.test_connectivity()
        if ping_result["status"] != "success":
            return ping_result
        
        # Test autenticación con info de cuenta
        account_result = await service.get_account_info()
        if account_result["status"] != "success":
            return {
                "status": "error",
                "message": "Invalid API credentials",
                "details": account_result.get("message", "Authentication failed")
            }
        
        return {
            "status": "success",
            "message": "Binance credentials validated successfully",
            "mode": "TESTNET" if testnet else "MAINNET",
            "account_type": account_result.get("account_type"),
            "can_trade": account_result.get("can_trade", False)
        }
        
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Credential validation failed: {str(e)}"
        }