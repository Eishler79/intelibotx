#!/usr/bin/env python3
"""
🛡️ Custom Exception Classes - DL-001 COMPLIANT
Centralized exception hierarchy for InteliBotX system

GUARDRAILS COMPLIANCE:
✅ P1: New file creation (non-critical, utils/ directory)
✅ DL-001: No hardcode messages, dynamic error context
✅ DL-003: Railway compatible, no psycopg2 dependencies
"""

from typing import Optional, Dict, Any
import traceback


class InteliBotXException(Exception):
    """
    Base exception class for all InteliBotX custom exceptions
    
    DL-001 COMPLIANCE: Dynamic error messages, no hardcode
    """
    def __init__(
        self, 
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        original_exception: Optional[Exception] = None
    ):
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        self.original_exception = original_exception
        
        # Store traceback for debugging
        self.traceback_str = traceback.format_exc() if original_exception else None
        
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for JSON serialization"""
        return {
            "error_type": self.__class__.__name__,
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details,
            "original_exception": str(self.original_exception) if self.original_exception else None
        }


class AuthenticationError(InteliBotXException):
    """
    Authentication and authorization failures
    
    Usage: JWT validation, user permissions, API keys
    """
    def __init__(self, message: str = "Authentication failed", **kwargs):
        super().__init__(message, error_code="AUTH_FAILED", **kwargs)


class ValidationError(InteliBotXException):
    """
    Input validation and data format errors
    
    Usage: Request validation, parameter checking, data format issues
    """
    def __init__(self, message: str = "Validation failed", **kwargs):
        super().__init__(message, error_code="VALIDATION_ERROR", **kwargs)


class TradingOperationError(InteliBotXException):
    """
    Trading operation and bot execution failures
    
    Usage: Order execution, bot configuration, trading strategy errors
    """
    def __init__(self, message: str = "Trading operation failed", **kwargs):
        super().__init__(message, error_code="TRADING_ERROR", **kwargs)


class ExchangeConnectionError(InteliBotXException):
    """
    External exchange API connection and communication failures
    
    Usage: Binance API errors, network issues, rate limiting
    """
    def __init__(self, message: str = "Exchange connection failed", **kwargs):
        super().__init__(message, error_code="EXCHANGE_ERROR", **kwargs)


class DatabaseError(InteliBotXException):
    """
    Database connection and operation failures
    
    Usage: PostgreSQL errors, SQLModel issues, connection pooling problems
    """
    def __init__(self, message: str = "Database operation failed", **kwargs):
        super().__init__(message, error_code="DATABASE_ERROR", **kwargs)


class ConfigurationError(InteliBotXException):
    """
    Configuration and environment setup errors
    
    Usage: Missing environment variables, invalid configuration, setup issues
    """
    def __init__(self, message: str = "Configuration error", **kwargs):
        super().__init__(message, error_code="CONFIG_ERROR", **kwargs)


class RateLimitError(InteliBotXException):
    """
    Rate limiting and API quota exceeded errors
    
    Usage: Too many requests, API limits, throttling
    """
    def __init__(self, message: str = "Rate limit exceeded", **kwargs):
        super().__init__(message, error_code="RATE_LIMIT", **kwargs)


class WebSocketError(InteliBotXException):
    """
    WebSocket connection and streaming data errors
    
    Usage: Real-time data streaming, connection drops, message parsing
    """
    def __init__(self, message: str = "WebSocket operation failed", **kwargs):
        super().__init__(message, error_code="WEBSOCKET_ERROR", **kwargs)


# Exception mapping for automatic conversion
EXCEPTION_MAP = {
    "authentication": AuthenticationError,
    "validation": ValidationError,
    "trading": TradingOperationError,
    "exchange": ExchangeConnectionError,
    "database": DatabaseError,
    "config": ConfigurationError,
    "rate_limit": RateLimitError,
    "websocket": WebSocketError,
}


def create_exception(
    exception_type: str,
    message: str,
    **kwargs
) -> InteliBotXException:
    """
    Factory function to create appropriate exception type
    
    DL-001 COMPLIANCE: Dynamic exception creation based on context
    """
    exception_class = EXCEPTION_MAP.get(exception_type.lower(), InteliBotXException)
    return exception_class(message, **kwargs)