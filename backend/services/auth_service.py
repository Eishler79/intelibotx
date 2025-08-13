### 📁 backend/services/auth_service.py
import os
import jwt
import bcrypt
import uuid
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlmodel import Session, select
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from models.user import User, UserSession, UserCreate, UserLogin
from db.database import get_session
from services.encryption_service import encryption_service

logger = logging.getLogger(__name__)

# Configuración JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
REFRESH_TOKEN_DAYS = 30

security = HTTPBearer()

class AuthService:
    """
    Servicio de autenticación con JWT para InteliBotX.
    Maneja registro, login, tokens y verificación de usuarios.
    """
    
    def __init__(self):
        self.secret_key = JWT_SECRET_KEY
        self.algorithm = JWT_ALGORITHM
    
    def hash_password(self, password: str) -> str:
        """Hash de contraseña con bcrypt."""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verificar contraseña contra hash."""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def create_jwt_token(self, user_id: int, email: str, 
                        expires_delta: Optional[timedelta] = None) -> Dict[str, Any]:
        """
        Crear token JWT para usuario autenticado.
        
        Returns:
            Dict con access_token, refresh_token, y metadata
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
        
        # Payload del token
        to_encode = {
            "sub": str(user_id),  # Subject (user ID)
            "email": email,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        access_token = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        
        # Refresh token con mayor duración
        refresh_expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_DAYS)
        refresh_payload = {
            "sub": str(user_id),
            "email": email,
            "exp": refresh_expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        refresh_token = jwt.encode(refresh_payload, self.secret_key, algorithm=self.algorithm)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": int(expires_delta.total_seconds()) if expires_delta else JWT_EXPIRATION_HOURS * 3600,
            "expires_at": expire.isoformat()
        }
    
    def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """
        Verificar y decodificar token JWT.
        
        Raises:
            HTTPException si token es inválido
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id = payload.get("sub")
            email = payload.get("email")
            
            if user_id is None or email is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
            return {
                "user_id": int(user_id),
                "email": email,
                "exp": payload.get("exp"),
                "type": payload.get("type", "access")
            }
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except (jwt.InvalidSignatureError, jwt.DecodeError, jwt.InvalidTokenError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    
    def generate_verification_token(self) -> str:
        """Generar token único para verificación de email."""
        return str(uuid.uuid4())
    
    def generate_reset_token(self) -> str:
        """Generar token único para reset de contraseña."""
        return secrets.token_urlsafe(32)
    
    def register_user(self, user_data: UserCreate, session: Session) -> User:
        """
        Registrar nuevo usuario en el sistema.
        Usuario creado con is_verified=False y verification_token.
        """
        # Verificar que email no exista
        existing_user = session.exec(
            select(User).where(User.email == user_data.email)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Crear usuario
        password_hash = self.hash_password(user_data.password)
        verification_token = self.generate_verification_token()
        verification_expires = datetime.utcnow() + timedelta(hours=24)
        
        new_user = User(
            email=user_data.email,
            password_hash=password_hash,
            full_name=user_data.full_name,
            created_at=datetime.utcnow(),
            is_verified=False,
            verification_token=verification_token,
            verification_expires=verification_expires
        )
        
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        
        logger.info(f"New user registered: {user_data.email} (verification required)")
        return new_user
    
    def authenticate_user(self, login_data: UserLogin, session: Session) -> User:
        """
        Autenticar usuario con email y contraseña.
        REQUIERE verificación de email para acceder.
        """
        user = session.exec(
            select(User).where(User.email == login_data.email)
        ).first()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        if not self.verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # BLOQUEAR usuarios no verificados
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email verification required. Please check your email and verify your account before logging in."
            )
        
        # Skip last_login update to avoid readonly database issues for Railway
        # user.last_login_at = datetime.utcnow()
        # session.add(user)
        # session.commit()
        
        logger.info(f"User authenticated: {login_data.email}")
        return user
    
    def get_user_by_id(self, user_id: int, session: Session) -> Optional[User]:
        """Obtener usuario por ID."""
        return session.get(User, user_id)
    
    def update_user_api_keys(self, user_id: int, api_keys_data: dict, session: Session) -> User:
        """
        Actualizar claves API de un usuario (encriptadas).
        """
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Encriptar credenciales
        encrypted_creds = encryption_service.encrypt_user_credentials(
            testnet_key=api_keys_data.get('testnet_key'),
            testnet_secret=api_keys_data.get('testnet_secret'),
            mainnet_key=api_keys_data.get('mainnet_key'),
            mainnet_secret=api_keys_data.get('mainnet_secret')
        )
        
        # Actualizar usuario
        for key, value in encrypted_creds.items():
            if value is not None:
                setattr(user, key, value)
        
        # Actualizar preferencias
        if api_keys_data.get('preferred_mode'):
            user.preferred_mode = api_keys_data['preferred_mode']
        
        # Marcar que tiene claves configuradas
        user.api_keys_configured = True
        user.updated_at = datetime.utcnow()
        
        session.add(user)
        session.commit()
        session.refresh(user)
        
        logger.info(f"API keys updated for user: {user.email}")
        return user
    
    def get_user_binance_credentials(self, user: User, mode: str = None) -> dict:
        """
        Obtener credenciales de Binance desencriptadas para un usuario.
        """
        if not user.api_keys_configured:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has no API keys configured"
            )
        
        use_mode = mode or user.preferred_mode
        
        user_dict = {
            'encrypted_binance_testnet_key': user.encrypted_binance_testnet_key,
            'encrypted_binance_testnet_secret': user.encrypted_binance_testnet_secret,
            'encrypted_binance_mainnet_key': user.encrypted_binance_mainnet_key,
            'encrypted_binance_mainnet_secret': user.encrypted_binance_mainnet_secret
        }
        
        credentials = encryption_service.decrypt_user_credentials(user_dict, use_mode)
        
        if not credentials.get('api_key') or not credentials.get('api_secret'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User has incomplete {use_mode} credentials"
            )
        
        return credentials
    
    def get_token_from_header(self, authorization: Optional[str] = None) -> str:
        """
        Extract JWT token from Authorization header
        """
        from fastapi import Header, HTTPException, status
        
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header required"
            )
        
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format"
            )
        
        return authorization.split(" ")[1]


# Instancia global del servicio
auth_service = AuthService()

# Dependency para obtener usuario actual
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    """
    Dependency para obtener usuario autenticado actual.
    Verifica token JWT y retorna usuario.
    """
    token = credentials.credentials
    token_data = auth_service.verify_jwt_token(token)
    
    user = auth_service.get_user_by_id(token_data["user_id"], session)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user

# Dependency para obtener credenciales de Binance del usuario actual
async def get_current_user_binance_creds(
    user: User = Depends(get_current_user),
    mode: Optional[str] = None
) -> dict:
    """
    Dependency para obtener credenciales de Binance del usuario autenticado.
    """
    return auth_service.get_user_binance_credentials(user, mode)

# Métodos de verificación de email (agregar a AuthService)
def verify_email_token(self, token: str, session: Session) -> User:
    """
    Verificar token de email y marcar usuario como verificado.
    """
    user = session.exec(
        select(User).where(
            User.verification_token == token,
            User.verification_expires > datetime.utcnow()
        )
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Marcar como verificado
    user.is_verified = True
    user.verification_token = None
    user.verification_expires = None
    user.updated_at = datetime.utcnow()
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    logger.info(f"User email verified: {user.email}")
    return user

def resend_verification_token(self, email: str, session: Session) -> User:
    """
    Regenerar token de verificación para usuario.
    """
    user = session.exec(
        select(User).where(User.email == email)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already verified"
        )
    
    # Generar nuevo token
    user.verification_token = self.generate_verification_token()
    user.verification_expires = datetime.utcnow() + timedelta(hours=24)
    user.updated_at = datetime.utcnow()
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    logger.info(f"Verification token regenerated for: {user.email}")
    return user

def request_password_reset(self, email: str, session: Session) -> User:
    """
    Solicitar reset de contraseña para usuario.
    Genera token seguro y actualiza usuario.
    """
    user = session.exec(
        select(User).where(User.email == email)
    ).first()
    
    if not user:
        # No revelar si el email existe o no por seguridad
        raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="If the email exists, a password reset link has been sent"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not active"
        )
    
    # Generar token de reset (1 hora de expiración)
    user.reset_token = self.generate_reset_token()
    user.reset_expires = datetime.utcnow() + timedelta(hours=1)
    user.updated_at = datetime.utcnow()
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    logger.info(f"Password reset requested for: {user.email}")
    return user

def reset_password(self, token: str, new_password: str, session: Session) -> User:
    """
    Resetear contraseña usando token válido.
    """
    user = session.exec(
        select(User).where(
            User.reset_token == token,
            User.reset_expires > datetime.utcnow()
        )
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Validar nueva contraseña
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Actualizar contraseña
    user.password_hash = self.hash_password(new_password)
    user.reset_token = None
    user.reset_expires = None
    user.updated_at = datetime.utcnow()
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    logger.info(f"Password reset completed for: {user.email}")
    return user

# Agregar métodos a la clase AuthService
AuthService.verify_email_token = verify_email_token
AuthService.resend_verification_token = resend_verification_token
AuthService.request_password_reset = request_password_reset
AuthService.reset_password = reset_password