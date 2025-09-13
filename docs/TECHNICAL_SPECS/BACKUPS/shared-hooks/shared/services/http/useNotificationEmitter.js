/**
 * 🔔 useNotificationEmitter - User Notifications Specialist
 * EXTRACTED FROM: httpInterceptor.js (DL-080 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: User notifications + fallback console logging
 * LINES TARGET: 35 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * UI INTEGRATION: Notification system abstraction layer
 */

/**
 * Specialized utility for user notifications
 * Handles: Notification display + fallback logging + message formatting
 */
export class NotificationEmitter {
  constructor(notificationSystem = null) {
    this.notificationSystem = notificationSystem;
  }

  /**
   * Show user notification with fallback to console
   */
  show(message, type = 'info', duration = 3000) {
    if (this.notificationSystem) {
      this.notificationSystem.show(message, type, duration);
    } else {
      // Fallback to console for debugging when notification system not available
      this.logToConsole(message, type);
    }
  }

  /**
   * Fallback console logging with appropriate formatting
   */
  logToConsole(message, type) {
    const emoji = this.getTypeEmoji(type);
    const formattedMessage = `${emoji} ${type.toUpperCase()}: ${message}`;
    
    switch (type) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warning':
        console.warn(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  /**
   * Get emoji for notification type
   */
  getTypeEmoji(type) {
    const emojis = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: '🔔'
    };
    return emojis[type] || '🔔';
  }
}

export default NotificationEmitter;