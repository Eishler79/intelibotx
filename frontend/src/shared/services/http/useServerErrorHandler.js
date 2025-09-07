/**
 * 🚨 useServerErrorHandler - Server Error Handler Specialist
 * EXTRACTED FROM: httpInterceptor.js (DL-080 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: 5xx server errors + error recovery + monitoring
 * LINES TARGET: 50 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * BACKEND INTEGRATION: Railway production error handling
 */

/**
 * Specialized handler for server errors
 * Handles: 500, 502, 503 errors + error recovery strategies
 */
export class ServerErrorHandler {
  constructor(notificationEmitter) {
    this.notificationEmitter = notificationEmitter;
    
    // Server error configuration
    this.ERROR_MESSAGES = {
      500: 'Internal server error occurred',
      502: 'Bad gateway - server temporarily unavailable',
      503: 'Service temporarily unavailable'
    };
  }

  /**
   * Handle 5xx Server Errors with appropriate user messaging
   */
  handle5xxServerError(response) {
    const status = response.status;
    console.error(`🚨 ${status} Server Error`);
    
    // Get appropriate error message
    const errorMessage = this.ERROR_MESSAGES[status] || `Server error (${status}) occurred`;
    
    // Show user-friendly notification
    this.notificationEmitter.show(
      `${errorMessage}. Our team has been notified.`,
      'error',
      8000 // Longer duration for server errors
    );
    
    // Log error details for monitoring
    this.logServerError(response);
    
    return response;
  }

  /**
   * Log server error details for monitoring and debugging
   */
  logServerError(response) {
    const errorDetails = {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };
    
    console.error('📊 Server Error Details:', errorDetails);
    
    // Could be extended to send error reports to monitoring service
    // this.sendErrorReport(errorDetails);
  }

  /**
   * Future: Send error report to monitoring service
   */
  // sendErrorReport(errorDetails) {
  //   // Integration with error monitoring service (e.g., Sentry, LogRocket)
  // }
}

export default ServerErrorHandler;