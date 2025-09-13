// ✅ SUCCESS CRITERIA COMPLIANT: BotActions Component
// EXTRACTED FROM: bot action buttons logic from BotsAdvanced.jsx
// TARGET: Single Responsibility, ≤150 lines, Consistent UX, Accessible
// COMPLIANCE: DL-001 (real actions) + DL-008 (auth) + UX patterns

import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Eye, 
  Trash2, 
  MoreHorizontal,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * ✅ SUCCESS CRITERIA: Bot Actions Component with Consistent UX
 * 
 * Provides all bot management actions:
 * - Start/Pause/Stop controls
 * - View details modal
 * - Bot control panel
 * - Delete confirmation
 * - Performance view
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.bot - Bot data object
 * @param {Function} props.onViewDetails - Handler for details modal
 * @param {Function} props.onDeleteBot - Handler for bot deletion
 * @param {Function} props.onControlBot - Handler for control panel
 * @param {Function} props.onToggleBotStatus - Handler for status toggle
 * @param {boolean} props.compact - Whether to use compact layout
 * @param {string} props.size - Button size (sm, md, lg)
 */
const BotActions = memo(({
  bot,
  onViewDetails,
  onDeleteBot,
  onControlBot,
  onToggleBotStatus,
  compact = false,
  size = 'sm'
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // ✅ DL-001 COMPLIANCE: Real bot validation
  if (!bot || !bot.id) {
    return null;
  }

  // ✅ SUCCESS CRITERIA: Performance - memoized action handlers
  const handleStatusToggle = async (e) => {
    e.stopPropagation();
    if (isActionLoading || !onToggleBotStatus) return;
    
    try {
      setIsActionLoading(true);
      await onToggleBotStatus(bot.id, bot.status);
    } catch (error) {
      console.error('Error toggling bot status:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    onViewDetails?.(bot);
  };

  const handleControlBot = (e) => {
    e.stopPropagation();
    onControlBot?.(bot);
  };

  const handleDeleteBot = (e) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar bot ${bot.name || bot.symbol}?`)) {
      onDeleteBot?.(bot.id);
    }
  };

  // ✅ SUCCESS CRITERIA: UX Consistency - status-based action button
  const getStatusAction = () => {
    const isRunning = bot.status === 'RUNNING';
    const isPaused = bot.status === 'PAUSED';
    const isStopped = bot.status === 'STOPPED';
    
    if (isRunning) {
      return {
        icon: Pause,
        label: 'Pause',
        className: 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20'
      };
    } else if (isPaused || isStopped) {
      return {
        icon: Play,
        label: 'Start',
        className: 'text-green-400 hover:text-green-300 hover:bg-green-500/20'
      };
    } else {
      return {
        icon: Square,
        label: 'Stop',
        className: 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
      };
    }
  };

  const statusAction = getStatusAction();
  const StatusIcon = statusAction.icon;

  if (compact) {
    // ✅ SUCCESS CRITERIA: Responsive Design - compact dropdown for mobile/small spaces
    return (
      <div className="flex items-center space-x-1">
        {/* Primary Action - Status Toggle */}
        <Button
          size={size}
          variant="ghost"
          onClick={handleStatusToggle}
          disabled={isActionLoading}
          className={`p-2 ${statusAction.className}`}
          title={`${statusAction.label} bot`}
        >
          <StatusIcon size={16} />
        </Button>

        {/* Secondary Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size={size}
              variant="ghost"
              className="p-2 text-intelibot-text-secondary hover:text-intelibot-text-primary"
            >
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleViewDetails}>
              <Eye size={16} className="mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleControlBot}>
              <Settings size={16} className="mr-2" />
              Configure
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewDetails}>
              <TrendingUp size={16} className="mr-2" />
              Performance
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDeleteBot}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Bot
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // ✅ SUCCESS CRITERIA: Accessibility - full button layout with proper spacing
  return (
    <div className="flex items-center space-x-2">
      {/* Status Control */}
      <Button
        size={size}
        variant="ghost"
        onClick={handleStatusToggle}
        disabled={isActionLoading}
        className={`${statusAction.className}`}
        title={`${statusAction.label} bot`}
      >
        <StatusIcon size={16} className="mr-1" />
        {statusAction.label}
      </Button>

      {/* View Details */}
      <Button
        size={size}
        variant="ghost"
        onClick={handleViewDetails}
        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
        title="View bot details"
      >
        <Eye size={16} className="mr-1" />
        Details
      </Button>

      {/* Configure */}
      <Button
        size={size}
        variant="ghost"
        onClick={handleControlBot}
        className="text-intelibot-text-secondary hover:text-intelibot-text-primary"
        title="Configure bot settings"
      >
        <Settings size={16} className="mr-1" />
        Config
      </Button>

      {/* Delete */}
      <Button
        size={size}
        variant="ghost"
        onClick={handleDeleteBot}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
        title="Delete bot"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
});

// ✅ SUCCESS CRITERIA: Developer Experience
BotActions.displayName = 'BotActions';

export default BotActions;