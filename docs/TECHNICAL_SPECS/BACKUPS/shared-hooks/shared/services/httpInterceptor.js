/**
 * 🔒 HTTP Interceptor - Main Orchestrator (DL-080 Refactored)
 * REFACTORED: 473→147 lines ✅ SUCCESS CRITERIA achieved
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * Eduard Guzmán - InteliBotX
 */

// DL-080 Specialized Handlers Import
import AuthResponseHandler from './http/useAuthHandler.js';
import RateLimitHandler from './http/useRateLimitHandler.js';
import ValidationHandler from './http/useValidationHandler.js';
import ServerErrorHandler from './http/useServerErrorHandler.js';
import SecurityValidator from './http/useSecurityValidator.js';
import TokenValidator from './http/useTokenValidator.js';
import NotificationEmitter from './http/useNotificationEmitter.js';

class HttpInterceptor {
  constructor() {
    this.authContext = null;
    this.isRefreshing = false;
    this.failedQueue = [];
    
    // DL-080: Initialize specialized handlers
    this.notificationEmitter = new NotificationEmitter();
    this.tokenValidator = new TokenValidator();
    this.authHandler = null; // Initialized after authContext is set
    this.rateLimitHandler = null;
    this.validationHandler = null;
    this.serverErrorHandler = null;
    this.securityValidator = null;
  }

  init(authContext, notificationSystem = null) {
    this.authContext = authContext;
    this.notificationEmitter = new NotificationEmitter(notificationSystem);
    
    // Initialize specialized handlers
    this.authHandler = new AuthResponseHandler(authContext, this.notificationEmitter);
    this.rateLimitHandler = new RateLimitHandler(this.notificationEmitter);
    this.validationHandler = new ValidationHandler(this.notificationEmitter);
    this.serverErrorHandler = new ServerErrorHandler(this.notificationEmitter);
    this.securityValidator = new SecurityValidator(this.notificationEmitter);
    
    this.setupFetchInterceptor();
    console.log('🔒 HTTP Interceptor initialized with DL-080 specialized handlers');
  }

  setupFetchInterceptor() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        await this.preRequestValidation(args);
        const response = await originalFetch(...args);
        return await this.postResponseProcessing(response, args);
      } catch (error) {
        return this.handleRequestError(error, args);
      }
    };
  }

  async preRequestValidation(args) {
    const [url] = args;
    
    if (this.tokenValidator.isAuthEndpoint(url)) {
      return;
    }
    
    if (this.authContext && this.authContext.token) {
      const isExpired = this.tokenValidator.isTokenExpired(this.authContext.token);
      
      if (isExpired) {
        console.warn('🔑 Token expired, triggering auto-logout');
        await this.authHandler.handleTokenExpiration();
        throw new Error('TOKEN_EXPIRED');
      }
    }
  }

  async postResponseProcessing(response, originalArgs) {
    switch (response.status) {
      case 200:
      case 201:
      case 204:
        return await this.securityValidator.handleSuccessResponse(response);
      case 401:
        return await this.authHandler.handle401Unauthorized(response, originalArgs);
      case 403:
        return this.authHandler.handle403Forbidden(response);
      case 429:
        return await this.rateLimitHandler.handle429RateLimited(response, originalArgs);
      case 422:
        return await this.validationHandler.handle422ValidationError(response);
      case 500:
      case 502:
      case 503:
        return this.serverErrorHandler.handle5xxServerError(response);
      default:
        return this.handleGenericError(response);
    }
  }

  handleGenericError(response) {
    console.warn(`⚠️ HTTP ${response.status} response`);
    return response;
  }

  handleRequestError(error) {
    console.error('🚨 Request error:', error);
    
    if (error.message === 'TOKEN_EXPIRED') {
      return this.createErrorResponse(401, 'TOKEN_EXPIRED', 'Session expired');
    }
    
    throw error;
  }

  createErrorResponse(status, errorCode, message) {
    return new Response(JSON.stringify({
      error_type: 'HttpInterceptorError',
      error_code: errorCode,
      message: message,
      status: status,
      timestamp: new Date().toISOString()
    }), {
      status: status,
      statusText: message,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Create singleton instance
const httpInterceptor = new HttpInterceptor();

export default httpInterceptor;