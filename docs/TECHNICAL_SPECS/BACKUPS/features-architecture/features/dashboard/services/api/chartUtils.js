/**
 * 📈 Chart Utils - ApexCharts Data Formatting Specialist
 * EXTRACTED FROM: dashboardService.js (DL-081 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Chart data formatting + ApexCharts integration
 * LINES TARGET: ≤70 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

/**
 * Format evolution data for ApexCharts consumption
 */
export const formatForApexCharts = (evolution, type = 'balance') => {
  if (!evolution || !Array.isArray(evolution)) {
    return { series: [], categories: [] };
  }

  const categories = evolution.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  });

  let series = [];
  
  switch (type) {
    case 'balance':
      series = [{
        name: 'Balance USD',
        data: evolution.map(item => parseFloat(item.balance || 0)),
        color: '#10B981'
      }];
      break;
      
    case 'pnl':
      series = [{
        name: 'PnL USD',
        data: evolution.map(item => parseFloat(item.pnl || 0)),
        color: '#F59E0B'
      }];
      break;
      
    case 'operations':
      series = [{
        name: 'Operaciones',
        data: evolution.map(item => parseInt(item.operations || 0)),
        color: '#3B82F6'
      }];
      break;
      
    default:
      series = [{
        name: 'Data',
        data: evolution.map(item => parseFloat(item.value || 0)),
        color: '#8B5CF6'
      }];
  }

  return {
    series,
    categories
  };
};

/**
 * Format performance data for multi-series charts
 */
export const formatMultiSeriesChart = (data, seriesConfig) => {
  if (!data || !Array.isArray(data)) {
    return { series: [], categories: [] };
  }

  const categories = data.map(item => item.label || item.name || item.symbol);
  const series = seriesConfig.map(config => ({
    name: config.name,
    data: data.map(item => parseFloat(item[config.field] || 0)),
    color: config.color
  }));

  return { series, categories };
};

export default {
  formatForApexCharts,
  formatMultiSeriesChart
};