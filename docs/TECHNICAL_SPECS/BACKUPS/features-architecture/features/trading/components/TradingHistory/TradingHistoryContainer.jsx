/**
 * TradingHistoryContainer.jsx - Main Container Component
 * EXTRACTED FROM: TradingHistory.jsx (refactored orchestrator)
 * 
 * ✅ DL-001: Real bot trading history - no hardcode
 * ✅ SUCCESS CRITERIA: ≤150 lines (150 lines)
 * ✅ SINGLE RESPONSIBILITY: Main container orchestration only
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTradingHistoryState } from '../../hooks/useTradingHistoryState';
import { useTradingHistoryData } from '../../hooks/useTradingHistoryData';
import TradingSummaryCards from './TradingSummaryCards';
import TradingHistoryTabs from './TradingHistoryTabs';
import TradingHistoryFilters from './TradingHistoryFilters';
import OrdersTable from './OrdersTable';
import TradesTable from './TradesTable';

/**
 * Trading History Main Container Component
 * Orchestrates all trading history functionality for a specific bot
 * 
 * @param {Object} props - Component props
 * @param {string} props.botId - Bot ID to load history for
 * @returns {JSX.Element} Complete trading history interface
 */
const TradingHistoryContainer = ({ botId }) => {
  // ✅ DL-076: Specialized hooks composition
  const state = useTradingHistoryState();
  const dataAPI = useTradingHistoryData(state);

  // Load data when botId or filters change
  useEffect(() => {
    if (botId) {
      dataAPI.loadTradingData(botId);
    }
  }, [botId, state.filters, dataAPI]);

  // Event handlers
  const handleTabChange = (tab) => {
    state.setActiveTab(tab);
  };

  const handleRefresh = () => {
    if (botId) {
      dataAPI.loadTradingData(botId);
    }
  };

  const handleCreateSample = async () => {
    if (botId) {
      const success = await dataAPI.createSampleData(botId);
      if (success) {
        console.log('✅ Sample data created successfully');
      } else {
        console.error('❌ Error creating sample data');
      }
    }
  };

  // Loading state
  if (state.loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <TradingSummaryCards summary={state.summary} />

      {/* Main Trading History Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            {/* Tab Navigation */}
            <TradingHistoryTabs
              activeTab={state.activeTab}
              onTabChange={handleTabChange}
              orders={state.orders}
              trades={state.trades}
            />
            
            {/* Filters and Controls */}
            <TradingHistoryFilters
              onRefresh={handleRefresh}
              onCreateSample={handleCreateSample}
              orders={state.orders}
              trades={state.trades}
              loading={state.loading}
            />
          </div>
        </CardHeader>

        <CardContent>
          {/* Conditional Table Rendering */}
          {state.activeTab === 'orders' && (
            <OrdersTable orders={state.orders} />
          )}
          
          {state.activeTab === 'trades' && (
            <TradesTable trades={state.trades} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingHistoryContainer;