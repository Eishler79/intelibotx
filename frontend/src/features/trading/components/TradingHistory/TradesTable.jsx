/**
 * TradesTable.jsx - Trades Table Specialized Component  
 * EXTRACTED FROM: TradingHistory.jsx (lines 251-304)
 * 
 * ✅ DL-001: Real trades data display - no hardcode
 * ✅ SUCCESS CRITERIA: ≤150 lines (140 lines)
 * ✅ SINGLE RESPONSIBILITY: Trades table display only
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  formatPrice, 
  formatDateTime, 
  formatPnL, 
  formatPnLPercentage,
  getStatusBadgeColor 
} from '../../hooks/useTradingHistoryFormatters.jsx';

/**
 * Trades Table Specialized Component
 * Displays trades history in table format with full trade details
 * 
 * @param {Object} props - Component props
 * @param {Array} props.trades - Array of trade objects
 * @returns {JSX.Element} Trades table
 */
const TradesTable = ({ trades = [] }) => {
  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay trades registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Símbolo</th>
            <th className="text-left p-2">Estrategia</th>
            <th className="text-left p-2">Precio Entry</th>
            <th className="text-left p-2">Precio Exit</th>
            <th className="text-left p-2">Cantidad</th>
            <th className="text-left p-2">P&L</th>
            <th className="text-left p-2">P&L %</th>
            <th className="text-left p-2">Estado</th>
            <th className="text-left p-2">Duración</th>
            <th className="text-left p-2">Abierto</th>
            <th className="text-left p-2">Cerrado</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="border-b hover:bg-gray-50">
              {/* Symbol */}
              <td className="p-2 font-mono">
                {trade.symbol || 'N/A'}
              </td>
              
              {/* Strategy */}
              <td className="p-2 text-xs">
                {trade.strategy || 'N/A'}
              </td>
              
              {/* Entry Price */}
              <td className="p-2">
                {formatPrice(trade.entry_price)}
              </td>
              
              {/* Exit Price */}
              <td className="p-2">
                {formatPrice(trade.exit_price)}
              </td>
              
              {/* Quantity */}
              <td className="p-2">
                {trade.quantity ? parseFloat(trade.quantity).toFixed(6) : 'N/A'}
              </td>
              
              {/* P&L */}
              <td className="p-2">
                {formatPnL(trade.realized_pnl || trade.unrealized_pnl)}
              </td>
              
              {/* P&L Percentage */}
              <td className="p-2">
                {formatPnLPercentage(trade.pnl_percentage)}
              </td>
              
              {/* Status */}
              <td className="p-2">
                <Badge className={getStatusBadgeColor(trade.status)}>
                  {trade.status || 'UNKNOWN'}
                </Badge>
              </td>
              
              {/* Duration */}
              <td className="p-2">
                {trade.duration_minutes ? `${trade.duration_minutes}m` : 'N/A'}
              </td>
              
              {/* Opened At */}
              <td className="p-2 text-xs">
                {formatDateTime(trade.opened_at)}
              </td>
              
              {/* Closed At */}
              <td className="p-2 text-xs">
                {formatDateTime(trade.closed_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradesTable;