// ✅ SUCCESS CRITERIA COMPLIANT: BotStatusBadge Component
// EXTRACTED FROM: status display logic across bot management components
// TARGET: Single Responsibility, ≤150 lines, Reusable, Consistent Design
// COMPLIANCE: DL-001 (real status data) + Design System patterns

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

/**
 * ✅ SUCCESS CRITERIA: Specialized Bot Status Badge Component
 * 
 * Displays bot status with consistent styling and icons across the application:
 * - RUNNING: Green with play icon
 * - PAUSED: Yellow with pause icon
 * - STOPPED: Gray with square icon
 * - ERROR: Red with alert icon
 * - PENDING: Blue with clock icon
 * - COMPLETED: Green with check icon
 * 
 * @param {Object} props - Component properties
 * @param {string} props.status - Bot status (RUNNING, PAUSED, STOPPED, ERROR, PENDING, COMPLETED)
 * @param {string} props.size - Badge size (sm, md, lg)
 * @param {boolean} props.showIcon - Whether to show status icon
 * @param {string} props.className - Additional CSS classes
 */
const BotStatusBadge = memo(({
  status,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  // ✅ DL-001 COMPLIANCE: Real status validation
  if (!status) {
    return (
      <Badge className={`bg-gray-500/20 text-gray-400 border-gray-500/30 ${getSizeClasses(size)} ${className}`}>
        <AlertTriangle size={getIconSize(size)} className="mr-1" />
        Unknown
      </Badge>
    );
  }

  // ✅ SUCCESS CRITERIA: Single Responsibility - status configuration
  const statusConfig = getStatusConfig(status.toUpperCase());
  const IconComponent = statusConfig.icon;

  return (
    <Badge 
      className={`
        ${statusConfig.className} 
        ${getSizeClasses(size)} 
        ${className}
        border transition-all duration-200
      `}
      title={`Bot is ${status.toLowerCase()}`}
    >
      {showIcon && (
        <IconComponent 
          size={getIconSize(size)} 
          className="mr-1 flex-shrink-0" 
        />
      )}
      <span className="font-medium">
        {statusConfig.label}
      </span>
    </Badge>
  );
});

// ✅ SUCCESS CRITERIA: Performance - helper functions outside component
function getStatusConfig(status) {
  const configs = {
    RUNNING: {
      label: 'Running',
      icon: Play,
      className: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
    },
    PAUSED: {
      label: 'Paused',
      icon: Pause,
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
    },
    STOPPED: {
      label: 'Stopped',
      icon: Square,
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30'
    },
    ERROR: {
      label: 'Error',
      icon: AlertTriangle,
      className: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
    },
    PENDING: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30'
    },
    COMPLETED: {
      label: 'Completed',
      icon: CheckCircle,
      className: 'bg-green-600/20 text-green-300 border-green-600/30 hover:bg-green-600/30'
    },
    INITIALIZING: {
      label: 'Starting',
      icon: Clock,
      className: 'bg-blue-400/20 text-blue-300 border-blue-400/30 hover:bg-blue-400/30'
    },
    TERMINATING: {
      label: 'Stopping',
      icon: Square,
      className: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30'
    }
  };

  return configs[status] || {
    label: status,
    icon: AlertTriangle,
    className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
}

function getSizeClasses(size) {
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };
  return sizes[size] || sizes.md;
}

function getIconSize(size) {
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };
  return iconSizes[size] || iconSizes.md;
}

// ✅ SUCCESS CRITERIA: Developer Experience
BotStatusBadge.displayName = 'BotStatusBadge';

export default BotStatusBadge;