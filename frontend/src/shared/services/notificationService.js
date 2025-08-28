// ✅ DL-040 Phase 5: Notification Service
// EXTRACTED FROM: pages/BotsAdvanced.jsx (Success/Error message handling)
// RISK LEVEL: 10% - Shared notification system extraction

/**
 * Notification Service
 * 
 * Centralized notification system for consistent user feedback across the application.
 * Handles success messages, error messages, and loading states with standardized formatting.
 * 
 * This service extracts the notification logic scattered across multiple components
 * to provide a unified and consistent user experience.
 */

class NotificationService {
  constructor() {
    this.listeners = [];
  }

  /**
   * Subscribe to notification events
   * @param {Function} callback - Function to call when notification is triggered
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Emit notification to all subscribers
   * @param {Object} notification - Notification object
   */
  emit(notification) {
    this.listeners.forEach(listener => listener(notification));
  }

  /**
   * Show success message
   * @param {string} message - Success message text
   * @param {number} duration - Display duration in milliseconds (default: 5000)
   */
  success(message, duration = 5000) {
    this.emit({
      type: 'success',
      message,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Show error message
   * @param {string} message - Error message text
   * @param {number} duration - Display duration in milliseconds (default: 8000)
   */
  error(message, duration = 8000) {
    this.emit({
      type: 'error',
      message,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Show info message
   * @param {string} message - Info message text
   * @param {number} duration - Display duration in milliseconds (default: 4000)
   */
  info(message, duration = 4000) {
    this.emit({
      type: 'info',
      message,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Show warning message
   * @param {string} message - Warning message text
   * @param {number} duration - Display duration in milliseconds (default: 6000)
   */
  warning(message, duration = 6000) {
    this.emit({
      type: 'warning',
      message,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Show loading message
   * @param {string} message - Loading message text
   */
  loading(message) {
    this.emit({
      type: 'loading',
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.emit({
      type: 'clear',
      timestamp: Date.now()
    });
  }

  /**
   * Show bot operation success message with enhanced formatting
   * @param {string} botName - Name of the bot
   * @param {string} operation - Operation performed (created, updated, deleted, etc.)
   * @param {Object} details - Additional details to include
   */
  botSuccess(botName, operation, details = {}) {
    let message = `✅ Bot "${botName}" ${operation} exitosamente`;
    
    if (details.changes) {
      message += ` - ${details.changes}`;
    }
    
    this.success(message);
  }

  /**
   * Show bot operation error message with enhanced formatting
   * @param {string} botName - Name of the bot
   * @param {string} operation - Operation attempted
   * @param {string} error - Error message
   */
  botError(botName, operation, error) {
    const message = `❌ Error al ${operation} bot "${botName}": ${error}`;
    this.error(message);
  }

  /**
   * Show trading operation notification
   * @param {Object} trade - Trading operation details
   */
  tradeNotification(trade) {
    const profit = trade.pnl >= 0;
    const message = `${profit ? '📈' : '📉'} ${trade.symbol}: ${trade.side} - PnL: ${profit ? '+' : ''}$${trade.pnl.toFixed(2)}`;
    
    if (profit) {
      this.success(message, 3000);
    } else {
      this.warning(message, 3000);
    }
  }

  /**
   * Show authentication related messages
   * @param {string} type - Type of auth message (login, logout, expired, etc.)
   * @param {string} customMessage - Custom message override
   */
  authMessage(type, customMessage = null) {
    const messages = {
      login: '✅ Sesión iniciada exitosamente',
      logout: '👋 Sesión cerrada exitosamente',
      expired: '⚠️ Sesión expirada. Por favor, inicia sesión nuevamente',
      unauthorized: '🔒 No tienes permisos para realizar esta acción',
      error: '❌ Error de autenticación. Intenta nuevamente'
    };

    const message = customMessage || messages[type] || messages.error;
    
    if (type === 'login' || type === 'logout') {
      this.success(message);
    } else if (type === 'expired' || type === 'unauthorized') {
      this.warning(message);
    } else {
      this.error(message);
    }
  }

  /**
   * Show API operation status
   * @param {string} operation - Operation name
   * @param {string} status - Status (loading, success, error)
   * @param {string} details - Additional details
   */
  apiStatus(operation, status, details = '') {
    switch (status) {
      case 'loading':
        this.loading(`Ejecutando ${operation}...`);
        break;
      case 'success':
        this.success(`✅ ${operation} completado exitosamente${details ? ` - ${details}` : ''}`);
        break;
      case 'error':
        this.error(`❌ Error en ${operation}${details ? `: ${details}` : ''}`);
        break;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;

// Export individual methods for convenience
export const {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  clear: clearNotifications,
  botSuccess: showBotSuccess,
  botError: showBotError,
  tradeNotification: showTradeNotification,
  authMessage: showAuthMessage,
  apiStatus: showApiStatus
} = notificationService;