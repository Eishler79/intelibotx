#!/usr/bin/env python3
"""
🏭 InstitutionalServiceFactory - Factory Pattern for Bot Services
Shared factory para crear services institucionales con bot_config context

Eduard Guzmán - InteliBotX
SPEC_REF: DL-112 INSTITUTIONAL SERVICE FACTORY PATTERN
"""

import logging
from typing import Optional, Dict, Any
from services.binance_real_data import BinanceRealDataService
from services.real_trading_engine import RealTradingEngine

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InstitutionalServiceFactory:
    """
    Factory para crear services institucionales configurados con bot_config context

    FILOSOFÍA: Un Bot Único con shared services que se adaptan a configuración usuario
    SPEC_REF: CORE_PHILOSOPHY.md#bot-concept + MODES_OVERVIEW.md#shared-services
    """

    @staticmethod
    def create_binance_service(
        bot_config,
        use_testnet: bool = True
    ) -> BinanceRealDataService:
        """
        Crear BinanceRealDataService configurado con bot_config

        Args:
            bot_config: Configuración del bot desde DB
            use_testnet: Si usar testnet de Binance (default: True)

        Returns:
            BinanceRealDataService configurado con market_type correcto
        """
        try:
            # ✅ DL-001 Compliance: No hardcode, usar bot_config
            market_type = getattr(bot_config, 'market_type', 'SPOT')

            service = BinanceRealDataService(
                use_testnet=use_testnet,
                market_type=market_type
            )

            logger.info(f"🏭 DL-112 FACTORY: BinanceRealDataService created - Market: {market_type}, Testnet: {use_testnet}")
            logger.info(f"🔗 DL-112 ENDPOINTS: {service.base_url}")
            return service

        except Exception as e:
            logger.error(f"❌ Error creating BinanceRealDataService: {e}")
            # ✅ P7: Error handling - fallback to SPOT
            fallback_service = BinanceRealDataService(
                use_testnet=use_testnet,
                market_type="SPOT"
            )
            logger.warning(f"⚠️ Using fallback SPOT service")
            return fallback_service

    @staticmethod
    def create_trading_engine(
        bot_config,
        exchange_credentials: Optional[Dict[str, Any]] = None
    ) -> RealTradingEngine:
        """
        Crear RealTradingEngine configurado con bot_config

        Args:
            bot_config: Configuración del bot desde DB
            exchange_credentials: Credenciales del exchange del usuario

        Returns:
            RealTradingEngine configurado con market_type correcto
        """
        try:
            # ✅ DL-001 Compliance: No hardcode, usar bot_config
            market_type = getattr(bot_config, 'market_type', 'SPOT')

            # TODO: Modificar RealTradingEngine constructor para accept market_type
            engine = RealTradingEngine(
                credentials=exchange_credentials or {}
            )

            # Set market_type as attribute for now (backwards compatible)
            engine.market_type = market_type

            logger.info(f"✅ RealTradingEngine created - Market: {market_type}")
            return engine

        except Exception as e:
            logger.error(f"❌ Error creating RealTradingEngine: {e}")
            # ✅ P7: Error handling - fallback engine
            fallback_engine = RealTradingEngine(credentials={})
            fallback_engine.market_type = "SPOT"
            logger.warning(f"⚠️ Using fallback SPOT trading engine")
            return fallback_engine

    @staticmethod
    def get_supported_market_types() -> list:
        """
        Obtener tipos de mercado soportados

        Returns:
            Lista de market_types válidos
        """
        return ["SPOT", "FUTURES_USDT", "FUTURES_COIN", "MARGIN_CROSS", "MARGIN_ISOLATED"]

    @staticmethod
    def validate_bot_config(bot_config) -> bool:
        """
        Validar que bot_config tiene campos requeridos

        Args:
            bot_config: Configuración del bot a validar

        Returns:
            True si bot_config es válido, False otherwise
        """
        required_fields = ['market_type', 'symbol', 'interval']

        for field in required_fields:
            if not hasattr(bot_config, field):
                logger.error(f"❌ bot_config missing required field: {field}")
                return False

        # Validar market_type válido
        if bot_config.market_type not in InstitutionalServiceFactory.get_supported_market_types():
            logger.error(f"❌ Invalid market_type: {bot_config.market_type}")
            return False

        return True

# 🧪 Testing del factory
async def test_institutional_service_factory():
    """Test completo del factory pattern"""
    from dataclasses import dataclass

    @dataclass
    class MockBotConfig:
        market_type: str = "SPOT"
        symbol: str = "BTCUSDT"
        interval: str = "15m"

    print("🧪 Testing InstitutionalServiceFactory...")

    # Test 1: BinanceRealDataService creation
    print("\n📊 Test 1: BinanceRealDataService creation")
    bot_config = MockBotConfig(market_type="FUTURES_USDT")

    binance_service = InstitutionalServiceFactory.create_binance_service(bot_config)
    print(f"✅ Service created: {binance_service.market_type}")

    # Test 2: TradingEngine creation
    print("\n🎯 Test 2: RealTradingEngine creation")
    trading_engine = InstitutionalServiceFactory.create_trading_engine(bot_config)
    print(f"✅ Engine created: {trading_engine.market_type}")

    # Test 3: Validation
    print("\n🔍 Test 3: Bot config validation")
    is_valid = InstitutionalServiceFactory.validate_bot_config(bot_config)
    print(f"✅ Validation result: {is_valid}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_institutional_service_factory())