"""
Service Factory Pattern - DL-110 FASE 2
Singleton services con aislamiento por bot_id para preservar state independiente

P5 AJUSTE: Cada bot tiene su propia instancia para evitar compartir performance_history
"""

from typing import Dict, Optional, Any
from services.binance_real_data import BinanceRealDataService
from services.advanced_algorithm_selector import AdvancedAlgorithmSelector
from services.market_microstructure_analyzer import MarketMicrostructureAnalyzer
from services.institutional_detector import InstitutionalDetector
from services.multi_timeframe_coordinator import MultiTimeframeCoordinator
from services.signal_quality_assessor import SignalQualityAssessor
from services.intelligent_mode_selector import IntelligentModeSelector

class ServiceFactory:
    """
    Factory pattern para gestionar instancias de servicios con aislamiento por bot
    DL-110: Reducir overhead de inicialización manteniendo aislamiento entre bots
    """

    _instances: Dict[str, Any] = {}

    @classmethod
    def get_binance_service(cls, bot_config: Optional[Any] = None) -> BinanceRealDataService:
        """
        BinanceRealDataService - DL-103: Ahora con soporte market_type (SPOT/FUTURES)
        Cambiado de bot_id a bot_config para recibir configuración completa
        """
        # DL-103 FIX: Extraer market_type del bot_config
        market_type = getattr(bot_config, 'market_type', 'SPOT') if bot_config else 'SPOT'

        # Clave única por market_type para separar instancias SPOT y FUTURES
        key = f"binance_service_{market_type}"

        if key not in cls._instances:
            # DL-103 FIX: Pasar market_type al constructor
            cls._instances[key] = BinanceRealDataService(market_type=market_type)
        return cls._instances[key]

    @classmethod
    def get_algorithm_selector(cls, bot_config: Optional[Any] = None) -> AdvancedAlgorithmSelector:
        """
        AdvancedAlgorithmSelector DEBE ser por bot_id (tiene performance_history)
        P5 AJUSTE: Instancia separada por bot para preservar aislamiento
        DL-103: Cambiado para recibir bot_config completo
        """
        bot_id = getattr(bot_config, 'id', None) if bot_config else None
        key = f"algorithm_selector_{bot_id}" if bot_id else "algorithm_selector_default"
        if key not in cls._instances:
            cls._instances[key] = AdvancedAlgorithmSelector()
        return cls._instances[key]

    @classmethod
    def get_microstructure_analyzer(cls, bot_config: Optional[Any] = None) -> MarketMicrostructureAnalyzer:
        """
        MarketMicrostructureAnalyzer por bot_id si mantiene estado
        DL-103: Cambiado para recibir bot_config completo
        """
        bot_id = getattr(bot_config, 'id', None) if bot_config else None
        key = f"microstructure_{bot_id}" if bot_id else "microstructure_default"
        if key not in cls._instances:
            cls._instances[key] = MarketMicrostructureAnalyzer()
        return cls._instances[key]

    @classmethod
    def get_institutional_detector(cls, bot_config: Optional[Any] = None) -> InstitutionalDetector:
        """
        InstitutionalDetector por bot_id para análisis independiente
        DL-103: Cambiado para recibir bot_config completo
        """
        bot_id = getattr(bot_config, 'id', None) if bot_config else None
        key = f"institutional_{bot_id}" if bot_id else "institutional_default"
        if key not in cls._instances:
            cls._instances[key] = InstitutionalDetector()
        return cls._instances[key]

    @classmethod
    def get_multi_tf_coordinator(cls, bot_config: Optional[Any] = None) -> MultiTimeframeCoordinator:
        """
        MultiTimeframeCoordinator por bot_id para coordinación independiente
        DL-103: Cambiado para recibir bot_config completo
        """
        bot_id = getattr(bot_config, 'id', None) if bot_config else None
        key = f"multi_tf_{bot_id}" if bot_id else "multi_tf_default"
        if key not in cls._instances:
            cls._instances[key] = MultiTimeframeCoordinator()
        return cls._instances[key]

    @classmethod
    def get_signal_quality_assessor(cls, bot_config: Optional[Any] = None) -> SignalQualityAssessor:
        """
        SignalQualityAssessor por bot_id para evaluación independiente
        DL-103: Cambiado para recibir bot_config completo
        """
        bot_id = getattr(bot_config, 'id', None) if bot_config else None
        key = f"signal_quality_{bot_id}" if bot_id else "signal_quality_default"
        if key not in cls._instances:
            # GAP #4: Pass bot_config to constructor
            cls._instances[key] = SignalQualityAssessor(bot_config)
        return cls._instances[key]

    @classmethod
    def get_mode_selector(cls, bot_config: Optional[Any] = None) -> IntelligentModeSelector:
        """
        IntelligentModeSelector por bot_id para decisiones independientes
        DL-103: Cambiado para recibir bot_config completo
        """
        bot_id = getattr(bot_config, 'id', None) if bot_config else None
        key = f"mode_selector_{bot_id}" if bot_id else "mode_selector_default"
        if key not in cls._instances:
            cls._instances[key] = IntelligentModeSelector()
        return cls._instances[key]

    @classmethod
    def clear_bot_instances(cls, bot_id: int):
        """
        Limpiar todas las instancias de un bot específico (útil para cleanup)
        """
        keys_to_remove = [k for k in cls._instances.keys() if f"_{bot_id}" in k]
        for key in keys_to_remove:
            del cls._instances[key]

    @classmethod
    def get_instance_count(cls) -> int:
        """
        Para debugging y monitoring
        """
        return len(cls._instances)

    @classmethod
    def get_instance_keys(cls) -> list:
        """
        Para debugging - ver qué instancias están en memoria
        """
        return list(cls._instances.keys())