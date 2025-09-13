import React from "react";
import BotTableHeader from "./BotTableHeader";
import BotTableRow from "./BotTableRow";
import BotTableEmptyState from "./BotTableEmptyState";
import useBotTableSorting from "../../hooks/useBotTableSorting";

/**
 * @typedef {Object} BotTableProps
 * @property {any[]} bots - Array of bot objects to display
 * @property {(id: number) => void} [onSelectBot] - Handler for bot selection
 * @property {(bot: any) => void} [onViewDetails] - Handler for viewing bot details
 * @property {(id: number) => void} [onDeleteBot] - Handler for bot deletion
 * @property {(bot: any) => void} [onControlBot] - Handler for bot control
 * @property {(id: number, status: string) => void} [onToggleBotStatus] - Handler for status toggle
 */

/**
 * BotTable Component - Main orchestrator for bot table functionality
 * 
 * @param {BotTableProps} props - Component props
 * @returns {JSX.Element} Complete bot table with header, rows, sorting and empty state
 */
const BotTable = ({
  bots,
  onSelectBot,
  onViewDetails,
  onDeleteBot,
  onControlBot,
  onToggleBotStatus
}) => {
  const { sortConfig, sortedBots, handleSort } = useBotTableSorting(bots);

  // Input validation with error handling
  if (!Array.isArray(bots)) {
    console.error('BotTable: bots prop must be an array, received:', typeof bots);
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 text-center">
        <p className="text-red-400 font-medium">Error: Invalid bots data</p>
        <p className="text-red-400/70 text-sm">Expected array, received {typeof bots}</p>
      </div>
    );
  }

  // Prepare handler props for BotTableRow
  const handlers = {
    onSelectBot,
    onViewDetails,
    onDeleteBot,
    onControlBot,
    onToggleBotStatus
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
      <table className="w-full text-sm">
        <BotTableHeader 
          sortConfig={sortConfig} 
          onSort={handleSort} 
        />
        <tbody>
          {sortedBots.map((bot, index) => (
            <BotTableRow 
              key={bot.id || `bot-${index}`}
              bot={bot}
              index={index}
              {...handlers}
            />
          ))}
        </tbody>
      </table>
      
      {/* Conditional rendering for empty state */}
      {bots.length === 0 && (
        <BotTableEmptyState />
      )}
    </div>
  );
};

export default BotTable;