/**
 * 🔑 useTokenValidator - JWT Token Validator Specialist
 * EXTRACTED FROM: httpInterceptor.js (DL-080 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: JWT parsing + expiration validation + auth endpoints detection
 * LINES TARGET: 45 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * DL-008 COMPLIANCE: JWT authentication pattern preservation
 */

/**
 * Specialized utility for JWT token validation
 * Handles: JWT parsing, expiration checking, auth endpoint detection
 */
export class TokenValidator {
  constructor() {
    // Auth endpoints that don't require token validation
    this.AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
  }

  /**
   * Check if token is expired (JWT validation)
   */
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check expiration with small buffer (5 seconds)
      return payload.exp < (currentTime + 5);
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return true; // Treat invalid tokens as expired
    }
  }

  /**
   * Check if URL is an auth endpoint that doesn't require token
   */
  isAuthEndpoint(url) {
    return this.AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }

  /**
   * Extract token payload safely
   */
  getTokenPayload(token) {
    if (!token) return null;
    
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error extracting token payload:', error);
      return null;
    }
  }

  /**
   * Get token remaining time in seconds
   */
  getTokenRemainingTime(token) {
    const payload = this.getTokenPayload(token);
    if (!payload || !payload.exp) return 0;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
  }
}

export default TokenValidator;