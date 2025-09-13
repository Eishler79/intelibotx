import React from "react";
import { BarChart3 } from "lucide-react";

/**
 * @typedef {Object} BotTableEmptyStateProps
 * @property {string} [message] - Primary message to display
 * @property {string} [subMessage] - Secondary descriptive message
 */

/**
 * BotTableEmptyState Component - Empty state display for bot table
 * 
 * @param {BotTableEmptyStateProps} props - Component props
 * @returns {JSX.Element} Centered empty state with icon and messages
 */
const BotTableEmptyState = ({ 
  message = "No hay bots creados", 
  subMessage = "Crea tu primer bot inteligente para empezar" 
}) => {
  return (
    <div className="py-12 text-center">
      <div className="text-gray-400 mb-4">
        <BarChart3 size={48} className="mx-auto mb-4" />
        <p className="text-lg font-medium">{message}</p>
        <p className="text-sm">{subMessage}</p>
      </div>
    </div>
  );
};

export default BotTableEmptyState;