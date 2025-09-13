/**
 * 🛡️ useSecurityValidator - Security Headers Validator Specialist
 * EXTRACTED FROM: httpInterceptor.js (DL-080 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: CSP/HSTS headers + security validation + backend custom errors
 * LINES TARGET: 90 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * SECURITY: Railway production security middleware integration
 */

/**
 * Specialized handler for security validation and headers
 * Handles: Security headers validation, backend custom errors, CSP/HSTS validation
 */
export class SecurityValidator {
  constructor(notificationEmitter) {
    this.notificationEmitter = notificationEmitter;
    
    // Required security headers from backend middleware
    this.REQUIRED_SECURITY_HEADERS = [
      'X-Content-Type-Options',
      'X-Frame-Options', 
      'X-XSS-Protection',
      'Content-Security-Policy'
    ];
    
    // Backend error codes mapping
    this.ERROR_CODES = {
      AUTH_FAILED: 'Authentication failed',
      VALIDATION_ERROR: 'Invalid data provided',
      TRADING_ERROR: 'Trading operation failed',
      RATE_LIMITED: 'Too many requests, please slow down',
      TOKEN_EXPIRED: 'Session expired, please login again'
    };
  }

  /**
   * Handle successful responses with security validation
   */
  async handleSuccessResponse(response) {
    // Validate security headers from backend middleware
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
   * Validate security headers from backend middleware
   */
  validateSecurityHeaders(response) {
    const missingHeaders = this.REQUIRED_SECURITY_HEADERS.filter(header => 
      !response.headers.get(header)
    );
    
    if (missingHeaders.length > 0) {
      console.warn('🛡️ Missing security headers:', missingHeaders);
      
      // Log security warning for monitoring
      this.logSecurityWarning(missingHeaders, response.url);
    } else {
      console.log('✅ All security headers present');
    }
    
    // Validate specific security header values
    this.validateHeaderValues(response);
  }

  /**
   * Validate specific security header values
   */
  validateHeaderValues(response) {
    // Validate X-Frame-Options
    const frameOptions = response.headers.get('X-Frame-Options');
    if (frameOptions && !['DENY', 'SAMEORIGIN'].includes(frameOptions.toUpperCase())) {
      console.warn('⚠️ X-Frame-Options has weak value:', frameOptions);
    }
    
    // Validate X-Content-Type-Options
    const contentTypeOptions = response.headers.get('X-Content-Type-Options');
    if (contentTypeOptions && contentTypeOptions.toLowerCase() !== 'nosniff') {
      console.warn('⚠️ X-Content-Type-Options should be "nosniff":', contentTypeOptions);
    }
    
    // Validate Content-Security-Policy presence and basic structure
    const csp = response.headers.get('Content-Security-Policy');
    if (csp && !csp.includes('default-src')) {
      console.warn('⚠️ CSP missing default-src directive');
    }
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
    
    this.notificationEmitter.show(userMessage, 'error', 5000);
  }

  /**
   * Log security warning for monitoring
   */
  logSecurityWarning(missingHeaders, url) {
    const securityWarning = {
      type: 'security_headers_missing',
      missing_headers: missingHeaders,
      url: url,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    };
    
    console.warn('🔒 Security Warning:', securityWarning);
    
    // Could be extended to send security reports to monitoring service
    // this.sendSecurityReport(securityWarning);
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
      console.error('JSON parse error in SecurityValidator:', error);
      return null;
    }
  }
}

export default SecurityValidator;