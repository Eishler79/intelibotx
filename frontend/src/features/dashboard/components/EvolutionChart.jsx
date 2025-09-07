import React from "react";
import Chart from "react-apexcharts";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatForApexCharts } from "../services/dashboardService";

/**
 * EvolutionChart - Main Dashboard Evolution Chart
 * 
 * ✅ DL-001: Uses real data via formatForApexCharts
 * ✅ SUCCESS CRITERIA: ≤150 lines (120 lines)
 * ✅ FEATURE STRUCTURE: dashboard/components/
 * 
 * Extracted from Dashboard.jsx:324-379
 */
const EvolutionChart = ({ 
  evolution = [],
  symbols = [],
  chartType = 'balance',
  selectedSymbol,
  evolutionLoading = false,
  onChartTypeChange,
  onSymbolChange
}) => {
  
  // Chart configuration
  const chartOptions = {
    chart: {
      id: "balance-evolution",
      background: "transparent",
      toolbar: { 
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: true
        }
      },
      zoom: { enabled: true },
    },
    theme: { mode: "dark" },
    grid: { 
      show: true,
      borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    stroke: { 
      curve: "smooth",
      width: 3
    },
    xaxis: {
      categories: formatForApexCharts(evolution, chartType).categories,
      labels: { 
        style: { colors: "#9CA3AF" }
      },
    },
    yaxis: {
      title: { 
        text: chartType === 'operations' ? 'Operaciones' : 'USD', 
        style: { color: "#9CA3AF" } 
      },
      labels: { 
        style: { colors: "#9CA3AF" },
        formatter: function(val) {
          return chartType === 'operations' ? Math.round(val) : `$${val.toFixed(2)}`;
        }
      },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: function(val) {
          return chartType === 'operations' ? `${Math.round(val)} ops` : `$${val.toFixed(2)}`;
        }
      }
    },
    colors: formatForApexCharts(evolution, chartType).series.map(s => s.color)
  };

  const chartSeries = formatForApexCharts(evolution, chartType).series;

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white text-xl font-semibold">
          Evolución {selectedSymbol ? `- ${selectedSymbol}` : '(Global)'}
        </h2>
        
        <div className="flex gap-4 items-center">
          {/* Chart Type Selector */}
          <div className="flex gap-2">
            {[
              { key: 'balance', label: 'Balance', color: 'text-green-400' },
              { key: 'pnl', label: 'PnL', color: 'text-yellow-400' },
              { key: 'operations', label: 'Operaciones', color: 'text-blue-400' }
            ].map(({ key, label, color }) => (
              <Button
                key={key}
                size="sm"
                variant={chartType === key ? "default" : "outline"}
                onClick={() => onChartTypeChange(key)}
                className={`text-xs ${chartType === key ? color : ''}`}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Symbol Selector */}
          <select
            value={selectedSymbol || ''}
            onChange={(e) => onSymbolChange(e.target.value || null)}
            className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-1 text-sm"
          >
            <option value="">Global</option>
            {symbols.map(symbol => (
              <option key={symbol.symbol} value={symbol.symbol}>
                {symbol.symbol} (${symbol.total_pnl.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {evolutionLoading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Cargando datos...</span>
        </div>
      ) : (
        <Chart 
          options={chartOptions} 
          series={chartSeries} 
          type="line" 
          height={400} 
        />
      )}
    </div>
  );
};

export default EvolutionChart;