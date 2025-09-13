/**
 * TradingHistoryTabs.jsx - Tab Navigation Component
 * EXTRACTED FROM: TradingHistory.jsx (lines 176-188)
 * 
 * ✅ DL-001: Tab navigation UI - no hardcode
 * ✅ SUCCESS CRITERIA: ≤150 lines (80 lines)
 * ✅ SINGLE RESPONSIBILITY: Tab navigation only
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Trading History Tab Navigation Component
 * Handles tab switching between Orders and Trades views
 * 
 * @param {Object} props - Component props
 * @param {string} props.activeTab - Currently active tab
 * @param {Function} props.onTabChange - Tab change handler
 * @param {Array} props.orders - Orders data for count badge
 * @param {Array} props.trades - Trades data for count badge
 * @returns {JSX.Element} Tab navigation buttons
 */
const TradingHistoryTabs = ({ 
  activeTab, 
  onTabChange, 
  orders = [], 
  trades = [] 
}) => {
  return (
    <div className="flex space-x-4">
      {/* Orders Tab */}
      <Button
        variant={activeTab === 'orders' ? 'default' : 'outline'}
        onClick={() => onTabChange('orders')}
        className="flex items-center gap-2"
      >
        <span>Órdenes</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          activeTab === 'orders' 
            ? 'bg-white/20 text-white' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {orders.length}
        </span>
      </Button>

      {/* Trades Tab */}
      <Button
        variant={activeTab === 'trades' ? 'default' : 'outline'}
        onClick={() => onTabChange('trades')}
        className="flex items-center gap-2"
      >
        <span>Trades</span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          activeTab === 'trades' 
            ? 'bg-white/20 text-white' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {trades.length}
        </span>
      </Button>
    </div>
  );
};

export default TradingHistoryTabs;