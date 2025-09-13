/**
 * OrdersTable.jsx - Orders Table Specialized Component
 * EXTRACTED FROM: TradingHistory.jsx (lines 204-250)
 * 
 * ✅ DL-001: Real orders data display - no hardcode
 * ✅ SUCCESS CRITERIA: ≤150 lines (140 lines)
 * ✅ SINGLE RESPONSIBILITY: Orders table display only
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  formatPrice, 
  formatDateTime, 
  getStatusBadgeColor,
  getSideBadgeColor 
} from '../../hooks/useTradingHistoryFormatters.jsx';

/**
 * Orders Table Specialized Component
 * Displays orders history in table format with full order details
 * 
 * @param {Object} props - Component props
 * @param {Array} props.orders - Array of order objects
 * @returns {JSX.Element} Orders table
 */
const OrdersTable = ({ orders = [] }) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay órdenes registradas</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Símbolo</th>
            <th className="text-left p-2">Dirección</th>
            <th className="text-left p-2">Tipo</th>
            <th className="text-left p-2">Cantidad</th>
            <th className="text-left p-2">Precio</th>
            <th className="text-left p-2">Estado</th>
            <th className="text-left p-2">Estrategia</th>
            <th className="text-left p-2">Confianza</th>
            <th className="text-left p-2">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b hover:bg-gray-50">
              {/* Symbol */}
              <td className="p-2 font-mono">
                {order.symbol || 'N/A'}
              </td>
              
              {/* Side (BUY/SELL) */}
              <td className="p-2">
                <Badge className={getSideBadgeColor(order.side)}>
                  {order.side || 'N/A'}
                </Badge>
              </td>
              
              {/* Order Type */}
              <td className="p-2 text-gray-600">
                {order.type || 'N/A'}
              </td>
              
              {/* Quantity */}
              <td className="p-2">
                {order.quantity ? parseFloat(order.quantity).toFixed(6) : 'N/A'}
              </td>
              
              {/* Price */}
              <td className="p-2">
                {formatPrice(order.avg_fill_price || order.market_price_at_creation)}
              </td>
              
              {/* Status */}
              <td className="p-2">
                <Badge className={getStatusBadgeColor(order.status)}>
                  {order.status || 'UNKNOWN'}
                </Badge>
              </td>
              
              {/* Strategy */}
              <td className="p-2 text-xs">
                {order.strategy_applied || 'N/A'}
              </td>
              
              {/* Confidence Level */}
              <td className="p-2">
                {order.confidence_level ? 
                  `${(order.confidence_level * 100).toFixed(1)}%` : 'N/A'}
              </td>
              
              {/* Created Date */}
              <td className="p-2 text-xs">
                {formatDateTime(order.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;