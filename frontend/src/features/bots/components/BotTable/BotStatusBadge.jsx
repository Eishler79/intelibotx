import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, AlertTriangle } from "lucide-react";

/**
 * @typedef {Object} BotStatusBadgeProps
 * @property {'RUNNING'|'PAUSED'|'STOPPED'|'ERROR'} status - Bot status type
 * @property {'sm'|'md'|'lg'} [size='md'] - Badge size variant
 */

/**
 * BotStatusBadge Component - Visual status indicator with icon and color coding
 * 
 * @param {BotStatusBadgeProps} props - Component props
 * @returns {JSX.Element} Badge element with status-specific styling and icon
 */
const BotStatusBadge = ({ status, size = 'md' }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'RUNNING': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PAUSED': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'STOPPED': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'ERROR': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    const iconSize = size === 'sm' ? 10 : size === 'lg' ? 16 : 12;
    switch(status) {
      case 'RUNNING': return <Play size={iconSize} className="text-green-400" />;
      case 'PAUSED': return <Pause size={iconSize} className="text-yellow-400" />;
      case 'STOPPED': return <Square size={iconSize} className="text-gray-400" />;
      case 'ERROR': return <AlertTriangle size={iconSize} className="text-red-400" />;
      default: return <Square size={iconSize} className="text-gray-400" />;
    }
  };

  return (
    <Badge 
      className={`${getStatusColor(status)} flex items-center gap-1 px-2 py-1`}
    >
      {getStatusIcon(status)}
      <span className={`font-medium ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'}`}>
        {status}
      </span>
    </Badge>
  );
};

export default BotStatusBadge;