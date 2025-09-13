/**
 * TradingHistoryFilters.jsx - Filters and Controls Component
 * EXTRACTED FROM: TradingHistory.jsx (lines 190-199)
 * 
 * ✅ DL-001: Filter controls - no hardcode
 * ✅ SUCCESS CRITERIA: ≤150 lines (60 lines)
 * ✅ SINGLE RESPONSIBILITY: Filters and action buttons only
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Trading History Filters and Controls Component
 * Provides refresh and sample data creation controls
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onRefresh - Refresh data handler
 * @param {Function} props.onCreateSample - Create sample data handler
 * @param {Array} props.orders - Orders data for empty state check
 * @param {Array} props.trades - Trades data for empty state check
 * @param {boolean} props.loading - Loading state
 * @returns {JSX.Element} Filters and controls
 */
const TradingHistoryFilters = ({ 
  onRefresh, 
  onCreateSample, 
  orders = [], 
  trades = [],
  loading = false 
}) => {
  const hasData = orders.length > 0 || trades.length > 0;

  return (
    <div className="flex justify-end space-x-2">
      {/* Sample Data Button - Only show when no data */}
      {!hasData && (
        <Button 
          onClick={onCreateSample}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Crear Datos Demo
        </Button>
      )}
      
      {/* Refresh Button */}
      <Button 
        variant="outline" 
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        Actualizar
      </Button>
    </div>
  );
};

export default TradingHistoryFilters;