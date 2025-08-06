import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  BarChart3
} from "lucide-react";

export default function ProfessionalBotsTable({ 
  bots, 
  onSelectBot, 
  onDeleteBot, 
  onControlBot,
  onToggleBotStatus 
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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
    switch(status) {
      case 'RUNNING': return <Play size={12} className="text-green-400" />;
      case 'PAUSED': return <Pause size={12} className="text-yellow-400" />;
      case 'STOPPED': return <Square size={12} className="text-gray-400" />;
      case 'ERROR': return <AlertTriangle size={12} className="text-red-400" />;
      default: return <Square size={12} className="text-gray-400" />;
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedBots = React.useMemo(() => {
    let sortableBots = [...bots];
    if (sortConfig.key) {
      sortableBots.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle nested metrics
        if (sortConfig.key.includes('.')) {
          const keys = sortConfig.key.split('.');
          aValue = keys.reduce((obj, key) => obj?.[key], a);
          bValue = keys.reduce((obj, key) => obj?.[key], b);
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableBots;
  }, [bots, sortConfig]);

  const formatPnL = (bot) => {
    const pnl = (Math.random() - 0.5) * 2000; // Mock PnL
    return {
      value: pnl,
      formatted: pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`,
      color: pnl >= 0 ? 'text-green-400' : 'text-red-400'
    };
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700/50">
        <h3 className="text-lg font-semibold text-white">Bots Activos ({bots.length})</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/30 border-b border-gray-700/50">
            <tr>
              <th 
                className="text-left px-6 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('symbol')}
              >
                Par / Estrategia
                {sortConfig.key === 'symbol' && (
                  <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="text-center px-4 py-4 font-medium text-gray-300">Estado</th>
              <th 
                className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('stake')}
              >
                Capital
                {sortConfig.key === 'stake' && (
                  <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('metrics.sharpeRatio')}
              >
                PnL
                {sortConfig.key === 'pnl' && (
                  <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('metrics.sharpeRatio')}
              >
                Sharpe
                {sortConfig.key === 'metrics.sharpeRatio' && (
                  <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('metrics.winRate')}
              >
                Win Rate
                {sortConfig.key === 'metrics.winRate' && (
                  <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('metrics.totalTrades')}
              >
                Trades
                {sortConfig.key === 'metrics.totalTrades' && (
                  <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('metrics.maxDrawdown')}
              >
                Max DD
                {sortConfig.key === 'metrics.maxDrawdown' && (
                  <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="text-center px-4 py-4 font-medium text-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedBots.map((bot, index) => {
              const pnl = formatPnL(bot);
              return (
                <tr 
                  key={bot.id} 
                  className={`border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors ${
                    index % 2 === 0 ? 'bg-gray-800/10' : 'bg-transparent'
                  }`}
                >
                  {/* Symbol / Strategy */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        {bot.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{bot.symbol}</div>
                        <div className="text-xs text-gray-400">{bot.strategy}</div>
                        <div className="text-xs text-purple-400">
                          {bot.marketType?.toUpperCase() || 'SPOT'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <Badge className={`${getStatusColor(bot.status)} flex items-center justify-center gap-1 w-fit mx-auto`}>
                      {getStatusIcon(bot.status)}
                      <span className="text-xs">{bot.status}</span>
                    </Badge>
                  </td>

                  {/* Capital */}
                  <td className="px-4 py-4 text-right">
                    <div className="font-semibold text-white">${bot.stake?.toLocaleString() || '0'}</div>
                    <div className="text-xs text-gray-400">USDT</div>
                  </td>

                  {/* PnL */}
                  <td className="px-4 py-4 text-right">
                    <div className={`font-semibold ${pnl.color}`}>
                      {pnl.formatted}
                    </div>
                    <div className="text-xs text-gray-400">
                      {pnl.value >= 0 ? '+' : ''}{((pnl.value / bot.stake) * 100).toFixed(2)}%
                    </div>
                  </td>

                  {/* Sharpe Ratio */}
                  <td className="px-4 py-4 text-right">
                    <div className="font-semibold text-green-400">
                      {bot.metrics?.sharpeRatio || '0.00'}
                    </div>
                    <div className="text-xs text-gray-400">Ratio</div>
                  </td>

                  {/* Win Rate */}
                  <td className="px-4 py-4 text-right">
                    <div className="font-semibold text-blue-400">
                      {bot.metrics?.winRate || '0'}%
                    </div>
                    <div className="text-xs text-gray-400">Win</div>
                  </td>

                  {/* Total Trades */}
                  <td className="px-4 py-4 text-right">
                    <div className="font-semibold text-white">
                      {bot.metrics?.totalTrades || 0}
                    </div>
                    <div className="text-xs text-gray-400">Total</div>
                  </td>

                  {/* Max Drawdown */}
                  <td className="px-4 py-4 text-right">
                    <div className="font-semibold text-red-400">
                      -{bot.metrics?.maxDrawdown || '0'}%
                    </div>
                    <div className="text-xs text-gray-400">DD</div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
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
                        onClick={() => onToggleBotStatus(bot.id, bot.status)}
                        title={bot.status === 'RUNNING' ? 'Pausar Bot' : 'Iniciar Bot'}
                      >
                        {bot.status === 'RUNNING' ? <Pause size={14} /> : <Play size={14} />}
                      </Button>

                      {/* View Details */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                        onClick={() => onSelectBot(bot)}
                        title="Ver Detalles"
                      >
                        <Eye size={14} />
                      </Button>

                      {/* Settings */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-gray-700"
                        onClick={() => onControlBot(bot)}
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
                          if (confirm(`¿Eliminar bot ${bot.symbol}?`)) {
                            onDeleteBot(bot.id);
                          }
                        }}
                        title="Eliminar Bot"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {bots.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-gray-400 mb-4">
            <BarChart3 size={48} className="mx-auto mb-4" />
            <p className="text-lg font-medium">No hay bots creados</p>
            <p className="text-sm">Crea tu primer bot inteligente para empezar</p>
          </div>
        </div>
      )}
    </div>
  );
}