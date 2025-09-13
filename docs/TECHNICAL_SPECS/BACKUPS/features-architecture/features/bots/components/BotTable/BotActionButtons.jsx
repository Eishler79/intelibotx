import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Eye, BarChart3, Settings, Trash2 } from "lucide-react";

/**
 * @typedef {Object} BotActionButtonsProps
 * @property {any} bot - Bot object containing status, id, symbol and other data
 * @property {(id: number, status: string) => void} [onToggleBotStatus] - Handler for toggle status button
 * @property {(bot: any) => void} [onViewDetails] - Handler for view details button
 * @property {(id: number) => void} [onSelectBot] - Handler for trading history button
 * @property {(bot: any) => void} [onControlBot] - Handler for settings button
 * @property {(id: number) => void} [onDeleteBot] - Handler for delete button
 */

/**
 * BotActionButtons Component - Action buttons for bot management
 * 
 * @param {BotActionButtonsProps} props - Component props
 * @returns {JSX.Element} Flex container with 5 action buttons
 */
const BotActionButtons = ({
  bot,
  onToggleBotStatus,
  onViewDetails,
  onSelectBot,
  onControlBot,
  onDeleteBot
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      {/* Toggle Status */}
      <Button
        size="sm"
        variant="ghost"
        className={`w-8 h-8 p-0 hover:bg-gray-700 ${
          bot.status === 'RUNNING' 
            ? 'text-yellow-400 hover:text-yellow-300' 
            : 'text-green-400 hover:text-green-300'
        }`}
        onClick={() => onToggleBotStatus && onToggleBotStatus(bot.id, bot.status)}
        title={bot.status === 'RUNNING' ? 'Pausar Bot' : 'Iniciar Bot'}
      >
        {bot.status === 'RUNNING' ? <Pause size={14} /> : <Play size={14} />}
      </Button>

      {/* View Advanced Details */}
      <Button
        size="sm"
        variant="ghost"
        className="w-8 h-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-gray-700"
        onClick={() => onViewDetails && onViewDetails(bot)}
        title="Ver Indicadores Avanzados"
      >
        <Eye size={14} />
      </Button>

      {/* View Trading History */}
      <Button
        size="sm"
        variant="ghost"
        className="w-8 h-8 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-gray-700"
        onClick={() => onSelectBot && onSelectBot(bot.id)}
        title="Ver Historial de Trading"
      >
        <BarChart3 size={14} />
      </Button>

      {/* Settings */}
      <Button
        size="sm"
        variant="ghost"
        className="w-8 h-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-gray-700"
        onClick={() => onControlBot && onControlBot(bot)}
        title="Configurar Bot"
      >
        <Settings size={14} />
      </Button>

      {/* Delete */}
      <Button
        size="sm"
        variant="ghost"
        className="w-8 h-8 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
        onClick={() => {
          if (onDeleteBot && confirm(`¿Eliminar bot ${bot.symbol || 'N/A'}?`)) {
            onDeleteBot(bot.id);
          }
        }}
        title="Eliminar Bot"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
};

export default BotActionButtons;