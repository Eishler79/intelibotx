/**
 * 🔐 useAuthHandler - Authentication Response Handler Specialist
 * EXTRACTED FROM: httpInterceptor.js (DL-080 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: 401/403 handling + token expiration + auto-logout
 * LINES TARGET: 80 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * DL-008 COMPLIANCE: JWT authentication pattern preservation
 */

/**
 * Specialized handler for authentication responses
 * Handles: 401 Unauthorized, 403 Forbidden, token expiration, auto-logout
 */
export class AuthResponseHandler {
  constructor(authContext, notificationEmitter) {
    this.authContext = authContext;
    this.notificationEmitter = notificationEmitter;
    this.isLoggingOut = false; // Prevent multiple simultaneous logouts
    
    // Backend error codes mapping for auth
    this.AUTH_ERROR_CODES = {
      AUTH_FAILED: 'Authentication failed',
      TOKEN_EXPIRED: 'Session expired, please login again',
      INSUFFICIENT_PERMISSIONS: 'Access denied'
    };
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
        
        this.notificationEmitter.show(
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
   * Handle 403 Forbidden - Insufficient permissions
   */
  handle403Forbidden(response) {
    console.warn('🚫 403 Forbidden - Insufficient permissions');
    
    this.notificationEmitter.show(
      'Access denied. You don\'t have permission for this action.',
      'error',
      5000
    );
    
    return response;
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
   * Redirect to login page with error prevention
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
   * Create standardized error response for auth failures
   */
  createErrorResponse(status, errorCode, message) {
    return new Response(JSON.stringify({
      error_type: 'AuthenticationError',
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
   * Safe JSON parsing with error handling
   */
  async safeJsonParse(response) {
    try {
      const text = await response.text();
      if (!text) return null;
      
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON parse error in AuthHandler:', error);
      return null;
    }
  }
}

export default AuthResponseHandler;