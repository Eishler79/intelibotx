// ✅ DL-040 Phase 6: Notification Container Component
// EXTRACTED FROM: pages/BotsAdvanced.jsx (Success message modal)
// RISK LEVEL: 5% - UI component extraction and optimization

import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

/**
 * Notification Container Component
 * 
 * Renders notification messages in a fixed position container.
 * Replaces the inline success/error message handling scattered across components
 * with a centralized, reusable notification system.
 * 
 * Features:
 * - Auto-positioning (top-right by default)
 * - Multiple notification support
 * - Auto-dismissal with customizable timing
 * - Consistent styling across notification types
 * - Manual dismissal capability
 * - Accessibility support
 * 
 * @param {Object} props - Component properties
 * @param {string} props.position - Container position ('top-right', 'top-left', etc.)
 * @param {number} props.maxNotifications - Maximum notifications to show simultaneously
 */
export default function NotificationContainer({ 
  position = 'top-right', 
  maxNotifications = 5 
}) {
  const { 
    notifications, 
    removeNotification, 
    getNotificationClasses, 
    getNotificationIcon 
  } = useNotifications();

  // Limit notifications displayed
  const displayNotifications = notifications.slice(-maxNotifications);

  // Position classes
  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'
  };

  if (displayNotifications.length === 0) {
    return null;
  }

  return (
    <div className={positionClasses[position] || positionClasses['top-right']}>
      <div className="space-y-3 min-w-80 max-w-96">
        {displayNotifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`${getNotificationClasses(notification.type)} animate-in slide-in-from-right duration-300`}
            role="alert"
            aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="text-lg flex-shrink-0 mt-0.5">
                {notification.type === 'loading' ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  getNotificationIcon(notification.type)
                )}
              </div>
              
              {/* Message */}
              <div className="flex-1 min-w-0">
                <div className="font-medium break-words">
                  {notification.message}
                </div>
                
                {/* Additional details if present */}
                {notification.details && (
                  <div className="text-xs opacity-80 mt-1">
                    {notification.details}
                  </div>
                )}
                
                {/* Timestamp for debugging (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs opacity-50 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
              
              {/* Dismiss button (only for non-loading notifications) */}
              {notification.type !== 'loading' && (
                <button 
                  onClick={() => removeNotification(notification.id)}
                  className="text-current hover:opacity-80 transition-opacity flex-shrink-0 p-1 -m-1"
                  aria-label="Cerrar notificación"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Progress bar for timed notifications */}
            {notification.duration && notification.type !== 'loading' && (
              <div className="mt-2 h-1 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current opacity-50 rounded-full animate-[shrink_var(--duration)_linear_forwards]"
                  style={{ 
                    '--duration': `${notification.duration}ms`,
                    animationName: 'notification-progress'
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* CSS Animation Styles */}
      <style jsx>{`
        @keyframes notification-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes slide-in-from-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-right {
          animation-name: slide-in-from-right;
        }
      `}</style>
    </div>
  );
}