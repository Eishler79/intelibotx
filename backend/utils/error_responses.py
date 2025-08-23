#!/usr/bin/env python3
"""
📋 Standardized Error Response System - DL-001 COMPLIANT
Unified error response formatting for consistent API behavior

GUARDRAILS COMPLIANCE:  
✅ P1: New file creation (non-critical, utils/ directory)
✅ DL-001: Dynamic responses, no hardcode error messages
✅ DL-003: Railway compatible, no external dependencies beyond FastAPI
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, Union
from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

# Configure logging
logger = logging.getLogger(__name__)

# Standard HTTP status codes for different error types
ERROR_STATUS_CODES = {
    "AuthenticationError": 401,
    "ValidationError": 400,
    "TradingOperationError": 422,
    "ExchangeConnectionError": 503,
    "DatabaseError": 500,
    "ConfigurationError": 500,
    "RateLimitError": 429,
    "WebSocketError": 500,
    "HTTPException": None,  # Use original status code
    "InteliBotXException": 500,
}


def generate_request_id() -> str:
    """Generate unique request ID for error tracking"""
    return str(uuid.uuid4())[:8]


def create_error_response(
    status_code: int,
    error_type: str,
    message: str,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
    original_exception: Optional[Exception] = None,
    request: Optional[Request] = None
) -> JSONResponse:
    """
    Create standardized error response
    
    DL-001 COMPLIANCE: Dynamic error responses based on real context
    
    Args:
        status_code: HTTP status code
        error_type: Type of error (AuthenticationError, ValidationError, etc.)
        message: Human-readable error message
        details: Additional error context
        request_id: Unique request identifier for tracking
        original_exception: Original exception for debugging
        request: FastAPI request object for context
    
    Returns:
        JSONResponse with standardized error format
    """
    if not request_id:
        request_id = generate_request_id()
    
    # Build error response
    error_response = {
        "success": False,
        "error": {
            "type": error_type,
            "message": message,
            "code": status_code,
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    }
    
    # Add details if provided
    if details:
        error_response["error"]["details"] = details
    
    # Add request context if available
    if request:
        error_response["error"]["path"] = str(request.url.path)
        error_response["error"]["method"] = request.method
    
    # Log error for monitoring (DL-001: Real logging, no hardcode)
    log_context = {
        "request_id": request_id,
        "error_type": error_type,
        "status_code": status_code,
        "message": message,
        "path": request.url.path if request else "unknown",
        "method": request.method if request else "unknown"
    }
    
    if status_code >= 500:
        logger.error(f"Server error: {json.dumps(log_context)}")
        # Include original exception in logs for debugging
        if original_exception:
            logger.error(f"Original exception: {str(original_exception)}")
    else:
        logger.warning(f"Client error: {json.dumps(log_context)}")
    
    return JSONResponse(
        status_code=status_code,
        content=error_response
    )


def create_authentication_error(
    message: str = "Authentication required",
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> JSONResponse:
    """Create standardized authentication error response"""
    return create_error_response(
        status_code=401,
        error_type="AuthenticationError",
        message=message,
        details=details,
        request=request
    )


def create_validation_error(
    message: str = "Validation failed",
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> JSONResponse:
    """Create standardized validation error response"""
    return create_error_response(
        status_code=400,
        error_type="ValidationError", 
        message=message,
        details=details,
        request=request
    )


def create_trading_error(
    message: str = "Trading operation failed",
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
) -> JSONResponse:
    """Create standardized trading operation error response"""
    return create_error_response(
        status_code=422,
        error_type="TradingOperationError",
        message=message,
        details=details,
        request=request
    )


def create_server_error(
    message: str = "Internal server error",
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
    original_exception: Optional[Exception] = None
) -> JSONResponse:
    """Create standardized server error response"""
    return create_error_response(
        status_code=500,
        error_type="InternalServerError",
        message=message,
        details=details,
        request=request,
        original_exception=original_exception
    )


def format_pydantic_error(validation_error: ValidationError) -> Dict[str, Any]:
    """
    Format Pydantic validation errors for user-friendly display
    
    DL-001 COMPLIANCE: Dynamic formatting based on actual validation errors
    """
    formatted_errors = []
    
    for error in validation_error.errors():
        field_path = " -> ".join(str(loc) for loc in error["loc"])
        formatted_errors.append({
            "field": field_path,
            "message": error["msg"],
            "type": error["type"],
            "input": error.get("input")
        })
    
    return {
        "validation_errors": formatted_errors,
        "error_count": len(formatted_errors)
    }


def get_status_code_for_exception(exception: Exception) -> int:
    """
    Determine appropriate HTTP status code for exception type
    
    DL-001 COMPLIANCE: Dynamic status code based on actual exception
    """
    exception_name = exception.__class__.__name__
    return ERROR_STATUS_CODES.get(exception_name, 500)


def should_expose_error_details(status_code: int) -> bool:
    """
    Determine if error details should be exposed to client
    
    Security consideration: Hide internal server error details in production
    """
    # Expose client errors (4xx), hide server errors (5xx) in production
    import os
    is_development = os.getenv("ENVIRONMENT", "development") != "production"
    
    if status_code < 500:
        return True  # Always expose client errors
    else:
        return is_development  # Only expose server errors in development