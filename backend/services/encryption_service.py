### 📁 backend/services/encryption_service.py
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EncryptionService:
    """
    Servicio de encriptación para API keys de usuarios.
    Usa AES-256 a través de Fernet (biblioteca cryptography).
    """
    
    def __init__(self):
        """✅ GUARDRAILS P3: Enhanced initialization with error handling"""
        try:
            self.master_key = self._get_or_create_master_key()
            self.fernet = Fernet(self.master_key)
            logger.debug("🔐 EncryptionService initialized successfully")
        except Exception as e:
            logger.error(f"❌ EncryptionService initialization failed: {e}")
            raise RuntimeError(f"Failed to initialize EncryptionService: {e}")
    
    def _get_or_create_master_key(self) -> bytes:
        """
        Obtiene o crea la clave maestra para encriptación.
        
        ✅ GUARDRAILS P3: Enhanced error handling + Railway production compliance
        """
        master_key_b64 = os.getenv("ENCRYPTION_MASTER_KEY")
        
        if not master_key_b64:
            # 🚨 CRÍTICO: En producción Railway esto debe fallar explícitamente
            error_msg = "ENCRYPTION_MASTER_KEY environment variable is required but not set"
            logger.error(f"❌ {error_msg}")
            
            # Solo permitir generación automática en desarrollo
            environment = os.getenv("ENVIRONMENT", "production").lower()
            if environment == "development":
                logger.warning("🔧 Development mode: generating temporary encryption key")
                key = Fernet.generate_key()
                master_key_b64 = base64.urlsafe_b64encode(key).decode()
                logger.info(f"Generated temporary key: ENCRYPTION_MASTER_KEY={master_key_b64}")
                logger.warning("⚠️ CRITICAL: Set ENCRYPTION_MASTER_KEY environment variable for production")
                return key
            else:
                # En producción Railway, fallar inmediatamente
                raise ValueError(f"❌ {error_msg} - Required for Railway production deployment")
        
        try:
            # Validar que la key base64 es válida
            decoded_key = base64.urlsafe_b64decode(master_key_b64.encode())
            
            # Validar que puede crear Fernet cipher válido
            test_fernet = Fernet(decoded_key)
            
            # Test de encriptación/desencriptación rápido
            test_data = b"validation_test"
            encrypted = test_fernet.encrypt(test_data)
            decrypted = test_fernet.decrypt(encrypted)
            assert decrypted == test_data
            
            logger.info("✅ ENCRYPTION_MASTER_KEY loaded and validated successfully")
            return decoded_key
            
        except Exception as e:
            logger.error(f"❌ Failed to decode/validate ENCRYPTION_MASTER_KEY: {e}")
            # En producción Railway, NO generar automáticamente
            environment = os.getenv("ENVIRONMENT", "production").lower()
            if environment == "production":
                raise ValueError(f"❌ Invalid ENCRYPTION_MASTER_KEY format: {e} - Fix Railway environment variable")
            else:
                # Solo en desarrollo, generar clave de emergencia
                logger.warning("🔧 Development fallback: generating emergency key due to invalid ENCRYPTION_MASTER_KEY")
                key = Fernet.generate_key()
                return key
    
    def encrypt_api_key(self, api_key: str) -> Optional[str]:
        """
        Encripta una API key de Binance.
        
        Args:
            api_key: La clave API en texto plano
            
        Returns:
            String encriptado en base64, o None si error
        """
        if not api_key or not api_key.strip():
            return None
            
        try:
            encrypted_bytes = self.fernet.encrypt(api_key.encode())
            return base64.urlsafe_b64encode(encrypted_bytes).decode()
        except Exception as e:
            logger.error(f"Error encrypting API key: {e}")
            return None
    
    def decrypt_api_key(self, encrypted_key: str) -> Optional[str]:
        """
        Desencripta una API key de Binance.
        
        Args:
            encrypted_key: Clave encriptada en base64
            
        Returns:
            API key en texto plano, o None si error
        """
        if not encrypted_key or not encrypted_key.strip():
            return None
            
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_key.encode())
            decrypted_bytes = self.fernet.decrypt(encrypted_bytes)
            return decrypted_bytes.decode()
        except Exception as e:
            logger.error(f"Error decrypting API key: {e}")
            return None
    
    def encrypt_api_secret(self, api_secret: str) -> Optional[str]:
        """
        Encripta un API secret de Binance.
        Mismo proceso que API key pero separado para claridad.
        """
        return self.encrypt_api_key(api_secret)
    
    def decrypt_api_secret(self, encrypted_secret: str) -> Optional[str]:
        """
        Desencripta un API secret de Binance.
        """
        return self.decrypt_api_key(encrypted_secret)
    
    def encrypt_user_credentials(self, testnet_key: str = None, testnet_secret: str = None,
                               mainnet_key: str = None, mainnet_secret: str = None) -> dict:
        """
        Encripta todas las credenciales de un usuario de una vez.
        
        Returns:
            Dict con claves encriptadas listas para guardar en DB
        """
        result = {}
        
        if testnet_key:
            result['encrypted_binance_testnet_key'] = self.encrypt_api_key(testnet_key)
        if testnet_secret:
            result['encrypted_binance_testnet_secret'] = self.encrypt_api_secret(testnet_secret)
        if mainnet_key:
            result['encrypted_binance_mainnet_key'] = self.encrypt_api_key(mainnet_key)
        if mainnet_secret:
            result['encrypted_binance_mainnet_secret'] = self.encrypt_api_secret(mainnet_secret)
            
        return result
    
    def decrypt_user_credentials(self, user_data: dict, mode: str = "TESTNET") -> dict:
        """
        Desencripta las credenciales de un usuario para uso.
        
        Args:
            user_data: Dict con datos del usuario de la DB
            mode: "TESTNET" o "MAINNET"
            
        Returns:
            Dict con claves desencriptadas listas para usar
        """
        result = {}
        
        if mode == "TESTNET":
            if user_data.get('encrypted_binance_testnet_key'):
                result['api_key'] = self.decrypt_api_key(user_data['encrypted_binance_testnet_key'])
            if user_data.get('encrypted_binance_testnet_secret'):
                result['api_secret'] = self.decrypt_api_secret(user_data['encrypted_binance_testnet_secret'])
        elif mode == "MAINNET":
            if user_data.get('encrypted_binance_mainnet_key'):
                result['api_key'] = self.decrypt_api_key(user_data['encrypted_binance_mainnet_key'])
            if user_data.get('encrypted_binance_mainnet_secret'):
                result['api_secret'] = self.decrypt_api_secret(user_data['encrypted_binance_mainnet_secret'])
        
        return result
    
    def validate_credentials_complete(self, user_data: dict, mode: str = "TESTNET") -> bool:
        """
        Valida que un usuario tenga credenciales completas para el modo especificado.
        """
        creds = self.decrypt_user_credentials(user_data, mode)
        return bool(creds.get('api_key') and creds.get('api_secret'))


# Instancia global del servicio
encryption_service = EncryptionService()

# Funciones helper para uso fácil
def encrypt_binance_credentials(testnet_key: str = None, testnet_secret: str = None,
                              mainnet_key: str = None, mainnet_secret: str = None) -> dict:
    """Helper function para encriptar credenciales de Binance."""
    return encryption_service.encrypt_user_credentials(
        testnet_key, testnet_secret, mainnet_key, mainnet_secret
    )

def decrypt_binance_credentials(user_data: dict, mode: str = "TESTNET") -> dict:
    """Helper function para desencriptar credenciales de Binance.""" 
    return encryption_service.decrypt_user_credentials(user_data, mode)

def validate_user_has_keys(user_data: dict, mode: str = "TESTNET") -> bool:
    """Helper function para validar que usuario tenga claves configuradas."""
    return encryption_service.validate_credentials_complete(user_data, mode)