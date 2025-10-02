/**
 * 🔒 HTTP Interceptor - Token Expiration & Security Handler
 * Conecta con sistema de seguridad backend (Rate Limiting + Custom Exceptions)
 *
 * INTEGRACIÓN BACKEND:
 * - Rate Limiting: Maneja 429 responses del backend slowapi
 * - Custom Exceptions: Procesa AuthenticationError, ValidationError, etc.
 * - Token Expiration: Auto-logout cuando JWT expire
 * - Security Headers: Valida respuestas con headers de seguridad
 *
 * Eduard Guzmán - InteliBotX
 */

// 🔍 CRITICAL: Store native fetch BEFORE any code can intercept it
if (!window.__NATIVE_FETCH__) {
  window.__NATIVE_FETCH__ = window.fetch;
  console.log('🔍 CRITICAL: Storing NATIVE fetch at module load:', {
    isNative: window.fetch.name === 'fetch',
    timestamp: new Date().toISOString()
  });
}

class HttpInterceptor {
  constructor() {
    this.authContext = null;
    this.notificationSystem = null;
    this.isRefreshing = false;
    this.failedQueue = [];
    this.isLoggingOut = false; // Prevent multiple simultaneous logouts

    // 🔍 DIAGNOSTIC: Store original fetch IMMEDIATELY on construction
    this.originalFetch = window.fetch;
    console.log('🔍 HTTP_INTERCEPTOR constructor - Storing original fetch:', {
      isNativeFetch: this.originalFetch.name === 'fetch',
      fetchName: this.originalFetch.name,
      timestamp: new Date().toISOString()
    });
    
    // Backend error codes mapping
    this.ERROR_CODES = {
      AUTH_FAILED: 'Authentication failed',
      VALIDATION_ERROR: 'Invalid data provided',
      TRADING_ERROR: 'Trading operation failed',
      RATE_LIMITED: 'Too many requests, please slow down',
      TOKEN_EXPIRED: 'Session expired, please login again'
    };

    // Rate limiting backoff strategy
    this.rateLimitRetryDelay = 1000; // Start with 1 second
    this.maxRetryDelay = 30000; // Max 30 seconds
  }

  /**
   * Initialize interceptor with AuthContext and notification system
   */
  init(authContext, notificationSystem = null) {
    // Update context and notification system
    this.authContext = authContext;
    this.notificationSystem = notificationSystem;

    // 🔍 DIAGNOSTIC: Prevent double initialization of fetch interceptor
    if (this.isInitialized) {
      console.log('⚠️ HTTP Interceptor already initialized, updating context only');
      return;
    }

    this.isInitialized = true;

    // Override fetch globally - ONLY ONCE
    this.setupFetchInterceptor();

    console.log('🔒 HTTP Interceptor initialized with backend security integration');
  }

  /**
   * Setup global fetch interceptor
   */
  setupFetchInterceptor() {
    // 🔍 DIAGNOSTIC: Check if fetch is already intercepted
    console.log('🔍 HTTP_INTERCEPTOR setupFetchInterceptor called:', {
      isOriginalFetch: window.fetch.name === 'fetch',
      currentFetchName: window.fetch.name,
      hasBeenIntercepted: window.fetch.toString().includes('interceptor'),
      usingGlobalNativeFetch: !!window.__NATIVE_FETCH__,
      globalFetchIsNative: window.__NATIVE_FETCH__ ? window.__NATIVE_FETCH__.name === 'fetch' : 'N/A',
      timestamp: new Date().toISOString()
    });

    // 🔍 FIX: Store native fetch OUTSIDE the interceptor function scope
    const nativeFetch = window.__NATIVE_FETCH__ || this.originalFetch;

    if (!nativeFetch || nativeFetch.name !== 'fetch') {
      console.error('🚨 CRITICAL: No native fetch available for interception!');
      return;
    }

    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      const isDashboardRequest = typeof url === 'string' && url.includes('/api/dashboard/');

      // 🔍 DIAGNOSTIC: Track Smart Scalper API calls specifically
      const isSmartScalperRequest = typeof url === 'string' &&
        (url.includes('/api/run-smart-trade/') || url.includes('/api/market-data/'));

      if (isSmartScalperRequest) {
        console.log('🎯 INTERCEPTOR: Smart Scalper API call detected:', {
          url,
          method: options?.method || 'GET',
          hasAuth: options?.headers?.Authorization ? 'YES' : 'NO',
          willCallOriginalFetch: true,
          timestamp: new Date().toISOString()
        });
      }

      if (isDashboardRequest) {
        const method = options?.method || 'GET';
        let bodyPreview = null;
        if (options?.body && typeof options.body === 'string') {
          try {
            bodyPreview = JSON.parse(options.body);
          } catch (e) {
            bodyPreview = options.body;
          }
        }
        console.log('🛰️ Dashboard request →', {
          url,
          method,
          body: bodyPreview
        });
      }

      try {
        // Pre-request validation
        await this.preRequestValidation(args);

        // Execute request using NATIVE fetch
        console.log('🔍 CRITICAL DEBUG: About to call nativeFetch:', {
          nativeFetchName: nativeFetch?.name,
          isNative: nativeFetch?.name === 'fetch',
          nativeFetchEquals__NATIVE_FETCH__: nativeFetch === window.__NATIVE_FETCH__,
          url: args[0]
        });
        const response = await nativeFetch(...args);

        // 🔍 DIAGNOSTIC: Track Smart Scalper response
        if (isSmartScalperRequest) {
          console.log('🎯 INTERCEPTOR: Smart Scalper API response received:', {
            url,
            status: response.status,
            statusText: response.statusText,
            originalFetchExecuted: true,
            timestamp: new Date().toISOString()
          });
        }

        if (isDashboardRequest) {
          const cloned = response.clone();
          let payload = null;
          try {
            payload = await cloned.json();
          } catch (_) {
            payload = '[non-JSON body]';
          }
          console.log('🛰️ Dashboard response ←', {
            url,
            status: response.status,
            payload
          });
        }
        
        // Post-response processing (pass nativeFetch for retry scenarios)
        return await this.postResponseProcessing(response, args, nativeFetch);
        
      } catch (error) {
        if (isDashboardRequest) {
          console.error('🛰️ Dashboard request failed', {
            url,
            error: error?.message || error
          });
        }
        return this.handleRequestError(error, args);
      }
    };
  }

  /**
   * Pre-request validation and token refresh
   * ✅ P3: CRITICAL FIX - NO bloquear requests sin token, solo validar si existe
   */
  async preRequestValidation(args) {
    const [url, options = {}] = args;

    // Skip validation for auth endpoints
    if (this.isAuthEndpoint(url)) {
      return;
    }

    // ✅ P3: ONLY validate token expiration if token exists
    // Do NOT throw errors if no token - let the backend handle 401
    if (this.authContext && this.authContext.token) {
      const isExpired = this.isTokenExpired(this.authContext.token);

      if (isExpired) {
        console.warn('🔑 Token expired detected - will let backend return 401');
        // ✅ P3: Do NOT throw here - let the request proceed and backend will respond 401
        // The 401 handler will trigger logout properly
        // This prevents blocking ALL requests when token expires
      }
    }

    // ✅ P3: If no authContext or no token - let request proceed
    // Public endpoints or endpoints that handle auth themselves will work
  }

  /**
   * Post-response processing with backend error handling
   */
  async postResponseProcessing(response, originalArgs, nativeFetch = null) {
    const [url, options = {}] = originalArgs;
    
    // Handle different HTTP status codes
    switch (response.status) {
      case 200:
      case 201:
      case 204:
        return this.handleSuccessResponse(response);
        
      case 401:
        return await this.handle401Unauthorized(response, originalArgs);
        
      case 403:
        return this.handle403Forbidden(response);
        
      case 429:
        return await this.handle429RateLimited(response, originalArgs, nativeFetch);
        
      case 422:
        return this.handle422ValidationError(response);
        
      case 500:
      case 502:
      case 503:
        return this.handle5xxServerError(response);
        
      default:
        return this.handleGenericError(response);
    }
  }

  /**
   * Handle successful responses with security validation
   */
  async handleSuccessResponse(response) {
    // Validate security headers (CSP, HSTS, etc.) from backend middleware
    this.validateSecurityHeaders(response);
    
    // Check for backend custom error format even in 200 responses
    const data = await this.safeJsonParse(response.clone());
    
    if (data && data.error_type) {
      console.warn('🚨 Backend returned custom error in 200 response:', data);
      this.handleBackendCustomError(data);
    }
    
    return response;
  }

  /**
   * Handle 401 Unauthorized - Token expired or invalid
   */
  async handle401Unauthorized(response, originalArgs) {
    console.warn('🔑 401 Unauthorized detected');
    
    try {
      const errorData = await this.safeJsonParse(response.clone());
      
      // Check if it's specifically token expiration
      if (errorData.error_code === 'AUTH_FAILED' || errorData.message?.includes('expired')) {
        await this.handleTokenExpiration();
        
        this.showNotification(
          'Session expired. Please login again.',
          'warning',
          5000
        );
        
        return this.createErrorResponse(401, 'TOKEN_EXPIRED', errorData.message);
      }
      
    } catch (parseError) {
      console.error('Error parsing 401 response:', parseError);
    }
    
    // Generic 401 handling
    await this.handleTokenExpiration();
    return this.createErrorResponse(401, 'AUTH_FAILED', 'Authentication required');
  }

  /**
   * Handle 403 Forbidden
   */
  handle403Forbidden(response) {
    console.warn('🚫 403 Forbidden - Insufficient permissions');
    
    this.showNotification(
      'Access denied. You don\'t have permission for this action.',
      'error',
      5000
    );
    
    return response;
  }

  /**
   * Handle 429 Rate Limited - Backend slowapi integration
   */
  async handle429RateLimited(response, originalArgs, nativeFetch = null) {
    console.warn('🚦 429 Rate Limited - Backend rate limiter triggered');
    
    // Parse rate limit headers from backend
    const retryAfter = response.headers.get('Retry-After') || '60';
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining') || '0';
    
    this.showNotification(
      `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
      'warning',
      parseInt(retryAfter) * 1000
    );
    
    // Implement exponential backoff retry
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      
      try {
        await this.sleep(parseInt(retryAfter) * 1000);
        
        // Retry the original request using NATIVE fetch
        const [url, options] = originalArgs;
        const retryResponse = await (nativeFetch || window.__NATIVE_FETCH__ || window.fetch)(url, options);
        
        this.isRefreshing = false;
        return retryResponse;
        
      } catch (retryError) {
        this.isRefreshing = false;
        throw retryError;
      }
    }
    
    return response;
  }

  /**
   * Handle 422 Validation Error - Backend ValidationError
   */
  async handle422ValidationError(response) {
    console.warn('📝 422 Validation Error');
    
    try {
      const errorData = await this.safeJsonParse(response.clone());
      
      if (errorData.error_code === 'VALIDATION_ERROR') {
        const validationDetails = errorData.details || {};
        
        this.showNotification(
          `Validation Error: ${errorData.message}`,
          'error',
          5000
        );
        
        // Emit validation errors for form handling
        this.emitValidationErrors(validationDetails);
      }
      
    } catch (parseError) {
      console.error('Error parsing 422 response:', parseError);
    }
    
    return response;
  }

  /**
   * Handle 5xx Server Errors
   */
  handle5xxServerError(response) {
    console.error(`🚨 ${response.status} Server Error`);
    
    this.showNotification(
      'Server error occurred. Our team has been notified.',
      'error',
      8000
    );
    
    return response;
  }

  /**
   * Handle generic errors
   */
  handleGenericError(response) {
    console.warn(`⚠️ HTTP ${response.status} response`);
    return response;
  }

  /**
   * Handle backend custom error format
   */
  handleBackendCustomError(errorData) {
    const { error_type, error_code, message, details } = errorData;
    
    console.warn('🎯 Backend Custom Error:', {
      type: error_type,
      code: error_code,
      message,
      details
    });
    
    // Map backend error codes to user-friendly messages
    const userMessage = this.ERROR_CODES[error_code] || message || 'An error occurred';
    
    this.showNotification(userMessage, 'error', 5000);
  }

  /**
   * Handle token expiration with auto-logout
   */
  async handleTokenExpiration() {
    // Prevent multiple simultaneous logouts
    if (this.isLoggingOut) {
      console.log('🔑 Logout already in progress, skipping...');
      return;
    }
    
    this.isLoggingOut = true;
    
    if (this.authContext && typeof this.authContext.logout === 'function') {
      console.log('🔑 Auto-logout triggered due to token expiration');
      
      // Clear token and user data
      await this.authContext.logout();
      
      // Redirect to login page
      this.redirectToLogin();
    }
  }

  /**
   * Check if token is expired (JWT validation)
   */
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return true; // Treat invalid tokens as expired
    }
  }

  /**
   * Validate security headers from backend middleware
   */
  validateSecurityHeaders(response) {
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Content-Security-Policy'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => 
      !response.headers.get(header)
    );
    
    if (missingHeaders.length > 0) {
      console.warn('🛡️ Missing security headers:', missingHeaders);
    }
  }

  /**
   * Safe JSON parsing with error handling
   */
  async safeJsonParse(response) {
    try {
      const text = await response.text();
      if (!text) return null;
      
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON parse error:', error);
      return null;
    }
  }

  /**
   * Create standardized error response
   */
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

  /**
   * Show user notification
   */
  showNotification(message, type = 'info', duration = 3000) {
    if (this.notificationSystem) {
      this.notificationSystem.show(message, type, duration);
    } else {
      // Fallback to console for debugging
      console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Emit validation errors for form handling
   */
  emitValidationErrors(validationDetails) {
    const event = new CustomEvent('validationErrors', {
      detail: validationDetails
    });
    window.dispatchEvent(event);
  }

  /**
   * Redirect to login page
   */
  redirectToLogin() {
    try {
      // Single navigation method to prevent double redirect
      if (window.location.pathname !== '/login') {
        console.log('🔄 Redirecting to login page');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Redirect error:', error);
      // Fallback navigation
      window.location.replace('/login');
    } finally {
      // Reset logout flag after redirect
      this.isLoggingOut = false;
    }
  }

  /**
   * Check if URL is an auth endpoint
   */
  isAuthEndpoint(url) {
    const authEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle request errors
   */
  handleRequestError(error, originalArgs) {
    console.error('🚨 Request error:', error);
    
    if (error.message === 'TOKEN_EXPIRED') {
      return this.createErrorResponse(401, 'TOKEN_EXPIRED', 'Session expired');
    }
    
    // Re-throw other errors
    throw error;
  }
}

// Create singleton instance
const httpInterceptor = new HttpInterceptor();

export default httpInterceptor;
