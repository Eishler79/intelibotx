/**
 * ⏰ Session Expiration Modal - Critical Session Warning
 * Modal crítico que aparece cuando la sesión está por expirar
 * 
 * CARACTERÍSTICAS:
 * - Modal bloquea la UI cuando quedan < 2 minutos
 * - Countdown timer visual
 * - Opciones: Extend session o Logout now
 * - Auto-logout si no hay respuesta
 * - Integrado con backend token management
 * 
 * Eduard Guzmán - InteliBotX
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../notifications/NotificationSystem';

const SessionExpirationModal = ({ 
  isOpen = false, 
  onClose = () => {}, 
  onExtend = () => {}, 
  onLogoutNow = () => {},
  timeRemaining = 0
}) => {
  const { user } = useAuth();
  const { showError } = useNotifications();
  
  const [countdown, setCountdown] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  // Update countdown from timeRemaining prop
  useEffect(() => {
    if (isOpen) {
      setCountdown(timeRemaining);
    }
  }, [isOpen, timeRemaining]);

  // Auto-logout when countdown reaches 0
  useEffect(() => {
    if (countdown <= 0 && isOpen) {
      console.log('⏰ Session countdown reached 0 - auto logout');
      onLogoutNow();
      onClose();
    }
  }, [countdown, isOpen, onLogoutNow, onClose]);

  // Handle extend session
  const handleExtendSession = async () => {
    setIsExtending(true);
    
    try {
      await onExtend();
      onClose();
    } catch (error) {
      console.error('Failed to extend session:', error);
      showError('Failed to extend session. You will be logged out.');
      
      // Auto-logout on extend failure
      setTimeout(() => {
        onLogoutNow();
        onClose();
      }, 2000);
    } finally {
      setIsExtending(false);
    }
  };

  // Handle logout now
  const handleLogoutNow = () => {
    onLogoutNow();
    onClose();
  };

  // Format countdown for display
  const formatCountdown = (timeMs) => {
    const minutes = Math.floor(timeMs / (1000 * 60));
    const seconds = Math.floor((timeMs % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get urgency color based on time remaining
  const getUrgencyColor = () => {
    const minutes = countdown / (1000 * 60);
    
    if (minutes <= 0.5) return 'text-red-600'; // 30 seconds
    if (minutes <= 1) return 'text-orange-600'; // 1 minute
    return 'text-yellow-600'; // > 1 minute
  };

  // Get progress bar color
  const getProgressColor = () => {
    const minutes = countdown / (1000 * 60);
    
    if (minutes <= 0.5) return 'bg-red-500';
    if (minutes <= 1) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  // Calculate progress percentage (assuming modal shows at 2 minutes)
  const getProgressPercentage = () => {
    const totalMs = 2 * 60 * 1000; // 2 minutes in milliseconds
    const percentage = Math.max(0, (countdown / totalMs) * 100);
    return percentage;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          
          {/* Header */}
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
              <span className="text-2xl">⏰</span>
            </div>
            
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Session Expiring Soon
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Your session will expire automatically for security reasons.
                  {user && (
                    <span className="block mt-1 font-medium text-gray-700">
                      User: {user.email}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Countdown Display */}
          <div className="mt-6 text-center">
            <div className={`text-4xl font-mono font-bold ${getUrgencyColor()}`}>
              {formatCountdown(countdown)}
            </div>
            <p className="text-sm text-gray-500 mt-1">time remaining</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Warning Message */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-500">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Action Required
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Save any unsaved work now. You will be automatically logged out 
                    when the timer reaches zero.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:flex sm:flex-row-reverse sm:gap-3">
            <button
              type="button"
              onClick={handleExtendSession}
              disabled={isExtending}
              className={`
                inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm
                sm:w-auto transition-colors duration-200
                ${isExtending 
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                }
              `}
            >
              {isExtending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Extending...
                </>
              ) : (
                '🔄 Extend Session'
              )}
            </button>
            
            <button
              type="button"
              onClick={handleLogoutNow}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            >
              🚪 Logout Now
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            <p>This is a security feature to protect your trading account.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExpirationModal;