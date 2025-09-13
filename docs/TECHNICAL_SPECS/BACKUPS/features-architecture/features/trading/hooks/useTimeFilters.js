import { useState, useCallback } from 'react';

/**
 * useTimeFilters - Specialized Time Filtering Logic
 * 
 * ✅ DL-001: Time filtering controls, no hardcode values
 * ✅ SINGLE RESPONSIBILITY: Time period management only
 * ✅ 30 lines extracted from LiveTradingFeed.jsx
 */
export const useTimeFilters = (initialHours = 24) => {
  const [timeFilter, setTimeFilter] = useState(initialHours);

  // Available time periods
  const timeOptions = [
    { value: 1, label: '1h', display: '1 hora' },
    { value: 6, label: '6h', display: '6 horas' },
    { value: 24, label: '1d', display: '1 día' },
    { value: 168, label: '7d', display: '7 días' }
  ];

  // Handle time filter change
  const handleTimeFilterChange = useCallback((hours) => {
    setTimeFilter(hours);
  }, []);

  // Get display label for current filter
  const getCurrentFilterLabel = () => {
    const option = timeOptions.find(opt => opt.value === timeFilter);
    return option ? option.display : `${timeFilter}h`;
  };

  // Get short label for buttons
  const getCurrentFilterShortLabel = () => {
    const option = timeOptions.find(opt => opt.value === timeFilter);
    return option ? option.label : `${timeFilter}h`;
  };

  return {
    // State
    timeFilter,
    timeOptions,
    
    // Actions
    handleTimeFilterChange,
    setTimeFilter,
    
    // Computed values
    getCurrentFilterLabel,
    getCurrentFilterShortLabel,
    
    // Convenience getters
    hours: timeFilter,
    isShortPeriod: timeFilter <= 6,
    isDailyOrMore: timeFilter >= 24
  };
};