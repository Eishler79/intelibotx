/**
 * 🔔 Notifications Hook - Feature-based Architecture (Refactored)
 * 
 * DL-076 SPECIALIZED HOOKS PATTERN INTEGRATION
 * SPEC_REF: GUARDRAILS.md#P1-P9 + DECISION_LOG.md#DL-076
 * 
 * MIGRATION STATUS:
 * - Removed broken notificationService dependency ✓
 * - Integrated with feature-based architecture ✓
 * - Maintains original API for backwards compatibility ✓
 * - Simplified implementation using specialized hooks ✓
 * 
 * Eduard Guzmán - InteliBotX
 */

import { useContext } from 'react';
import { useNotifications as useNotificationContext } from '../../components/notifications/NotificationSystem';

/**
 * Notifications Hook - Bridge to new architecture
 * 
 * This hook provides backwards compatibility while delegating to the 
 * refactored NotificationSystem architecture.
 * 
 * @returns {Object} Notification state and methods
 */
export function useNotifications() {
  return useNotificationContext();
}

export default useNotifications;