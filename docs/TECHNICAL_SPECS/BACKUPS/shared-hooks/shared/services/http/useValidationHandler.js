/**
 * 📝 useValidationHandler - Validation Error Handler Specialist
 * EXTRACTED FROM: httpInterceptor.js (DL-080 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: 422 validation handling + form validation + error emission
 * LINES TARGET: 60 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * BACKEND INTEGRATION: FastAPI ValidationError handling
 */

/**
 * Specialized handler for validation errors
 * Handles: 422 Validation Error, form validation, error emission
 */
export class ValidationHandler {
  constructor(notificationEmitter) {
    this.notificationEmitter = notificationEmitter;
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
        
        this.notificationEmitter.show(
          `Validation Error: ${errorData.message}`,
          'error',
          5000
        );
        
        // Emit validation errors for form handling
        this.emitValidationErrors(validationDetails);
        
        console.log('📋 Validation details emitted:', validationDetails);
      } else {
        // Generic 422 handling
        this.handleGenericValidationError(errorData);
      }
      
    } catch (parseError) {
      console.error('Error parsing 422 response:', parseError);
      this.handleGenericValidationError(null);
    }
    
    return response;
  }

  /**
   * Handle generic validation errors when parsing fails
   */
  handleGenericValidationError(errorData) {
    const message = errorData?.message || 'Validation error occurred';
    
    this.notificationEmitter.show(
      `Form validation failed: ${message}`,
      'error',
      5000
    );
  }

  /**
   * Emit validation errors for form handling
   */
  emitValidationErrors(validationDetails) {
    const event = new CustomEvent('validationErrors', {
      detail: {
        errors: validationDetails,
        timestamp: new Date().toISOString(),
        source: 'httpInterceptor'
      }
    });
    
    window.dispatchEvent(event);
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
      console.error('JSON parse error in ValidationHandler:', error);
      return null;
    }
  }
}

export default ValidationHandler;