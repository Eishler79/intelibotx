/**
 * TradingSummaryCards.jsx - Performance Summary Cards Display
 * EXTRACTED FROM: TradingHistory.jsx (lines 140-169)
 * 
 * ✅ DL-001: Real summary data display - no hardcode
 * ✅ SUCCESS CRITERIA: ≤150 lines (90 lines)
 * ✅ SINGLE RESPONSIBILITY: Performance summary cards only
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Trading Summary Performance Cards Component
 * Displays key performance metrics in card grid layout
 * 
 * @param {Object} props - Component props
 * @param {Object} props.summary - Trading summary data
 * @returns {JSX.Element} Summary cards grid
 */
const TradingSummaryCards = ({ summary }) => {
  // Don't render if no summary data
  if (!summary || !summary.summary) {
    return null;
  }

  const summaryData = summary.summary;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Trades Card */}
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {summaryData.total_trades || 0}
          </div>
          <p className="text-sm text-gray-600">Total Trades</p>
        </CardContent>
      </Card>

      {/* Win Rate Card */}
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {summaryData.win_rate || 0}%
          </div>
          <p className="text-sm text-gray-600">Win Rate</p>
        </CardContent>
      </Card>

      {/* Total P&L Card */}
      <Card>
        <CardContent className="p-4">
          <div className={`text-2xl font-bold ${
            (summaryData.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${summaryData.total_pnl || 0}
          </div>
          <p className="text-sm text-gray-600">Total P&L</p>
        </CardContent>
      </Card>

      {/* Profit Factor Card */}
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {summaryData.profit_factor || 0}
          </div>
          <p className="text-sm text-gray-600">Profit Factor</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingSummaryCards;