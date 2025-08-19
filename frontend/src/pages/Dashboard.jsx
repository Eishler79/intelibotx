import React, { useState } from "react";
import Chart from "react-apexcharts";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  Banknote, 
  BarChart2, 
  Zap, 
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Calendar,
  Filter,
  Award,
  Target,
  Settings,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  useDashboardData, 
  useBalanceEvolution, 
  useSymbolsAnalysis,
  formatForApexCharts 
} from "../services/dashboardService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userExchanges } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [chartType, setChartType] = useState('balance'); // 'balance', 'pnl', 'operations'

  // 📊 Datos reales del dashboard
  const { summary, loading: summaryLoading, error: summaryError, refetch } = useDashboardData();
  
  // 📈 Evolución del balance con filtros
  const { 
    evolution, 
    metrics, 
    loading: evolutionLoading 
  } = useBalanceEvolution(selectedPeriod, selectedSymbol);

  // 📊 Análisis por símbolos
  const { symbols, loading: symbolsLoading } = useSymbolsAnalysis(7);

  // 🎨 Configuración de gráficos
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

  // 📱 Componente de métrica con animación
  const MetricCard = ({ icon: Icon, title, value, change, isLoading, color = "text-white" }) => (
    <motion.div 
      whileHover={{ scale: 1.02 }} 
      className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl p-6 text-white w-full flex flex-col gap-2 hover:bg-white/10 transition-all"
    >
      {isLoading ? (
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-gray-400 rounded mb-2"></div>
          <div className="w-20 h-4 bg-gray-400 rounded mb-1"></div>
          <div className="w-16 h-6 bg-gray-400 rounded"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <Icon className={`${color} w-8 h-8`} />
            {change !== undefined && (
              <Badge className={`${
                change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {change >= 0 ? '+' : ''}{change}%
              </Badge>
            )}
          </div>
          <span className="text-sm text-gray-400">{title}</span>
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
        </>
      )}
    </motion.div>
  );

  // 🎯 Empty State Component - Exchange Configuration Required
  const ExchangeEmptyState = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl p-12 text-center"
    >
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Settings className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to InteliBotX</h2>
          <p className="text-gray-400">
            Connect your first exchange to start trading with professional algorithms
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/exchanges')}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            <Settings className="w-5 h-5 mr-2" />
            Configure Exchange
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-sm text-gray-500">
            You can explore other sections while setting up your exchange
          </p>
        </div>
      </div>
    </motion.div>
  );

  // Check if user has exchanges configured
  const hasExchanges = userExchanges && userExchanges.length > 0;

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* 📊 Header con controles */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
        <div className="flex gap-4">
          {/* Filtro de período */}
          <div className="flex gap-2">
            {[7, 30, 90].map(days => (
              <Button
                key={days}
                size="sm"
                variant={selectedPeriod === days ? "default" : "outline"}
                onClick={() => setSelectedPeriod(days)}
                className="text-xs"
              >
                {days}d
              </Button>
            ))}
          </div>
          
          {/* Botón refresh */}
          <Button size="sm" variant="outline" onClick={refetch}>
            <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ⚠️ Error state */}
      {summaryError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
          ❌ Error cargando datos: {summaryError}
        </div>
      )}

      {/* 🎯 Empty State - No Exchanges Configured */}
      {!hasExchanges && (
        <ExchangeEmptyState />
      )}

      {/* 📊 Dashboard Content - Show when has exchanges OR always show (user choice) */}
      {hasExchanges && (
        <div className="space-y-8">

      {/* 📊 Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={BarChart2}
          title="Bots activos"
          value={summary ? `${summary.active_bots}/${summary.total_bots}` : '0/0'}
          isLoading={summaryLoading}
          color="text-blue-400"
        />
        
        <MetricCard
          icon={TrendingUp}
          title="PnL de hoy"
          value={summary ? `$${summary.today_pnl}` : '$0'}
          change={summary?.today_pnl || 0}
          isLoading={summaryLoading}
          color={summary?.today_pnl >= 0 ? "text-green-400" : "text-red-400"}
        />
        
        <MetricCard
          icon={Activity}
          title="Operaciones hoy"
          value={summary ? summary.today_operations : 0}
          isLoading={summaryLoading}
          color="text-yellow-400"
        />
        
        <MetricCard
          icon={Banknote}
          title="Balance actual"
          value={summary ? `$${summary.current_balance || summary.total_balance || 0}` : '$0'}
          change={summary && summary.initial_capital && summary.total_pnl ? 
            ((summary.total_pnl / summary.initial_capital) * 100).toFixed(1) : 
            0}
          isLoading={summaryLoading}
          color="text-green-400"
        />
      </div>

      {/* 📊 Métricas adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={Target}
          title="Win Rate"
          value={summary ? `${summary.win_rate}%` : '0%'}
          isLoading={summaryLoading}
          color="text-purple-400"
        />
        
        <MetricCard
          icon={Zap}
          title="Total operaciones"
          value={summary ? summary.total_operations : 0}
          isLoading={summaryLoading}
          color="text-cyan-400"
        />
        
        <MetricCard
          icon={Award}
          title="PnL total"
          value={summary ? `$${summary.total_pnl}` : '$0'}
          isLoading={summaryLoading}
          color={summary?.total_pnl >= 0 ? "text-green-400" : "text-red-400"}
        />
      </div>

      {/* 📈 Gráfico principal con controles */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-semibold">
            Evolución {selectedSymbol ? `- ${selectedSymbol}` : '(Global)'}
          </h2>
          
          <div className="flex gap-4 items-center">
            {/* Selector de tipo de gráfico */}
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
                  onClick={() => setChartType(key)}
                  className={`text-xs ${chartType === key ? color : ''}`}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Selector de símbolo */}
            <select
              value={selectedSymbol || ''}
              onChange={(e) => setSelectedSymbol(e.target.value || null)}
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

      {/* 📊 Top símbolos performance */}
      {symbols.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl p-6">
          <h2 className="text-white text-xl font-semibold mb-6">Performance por Símbolo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {symbols.slice(0, 6).map(symbol => (
              <div key={symbol.symbol} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-white">{symbol.symbol}</span>
                  <Badge className={`${
                    symbol.total_pnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {symbol.total_pnl >= 0 ? '+' : ''}${symbol.total_pnl.toFixed(2)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Operaciones:</span>
                    <div className="text-white font-medium">{symbol.total_operations}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Win Rate:</span>
                    <div className="text-white font-medium">{symbol.win_rate}%</div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <span className="text-gray-400 text-xs">Promedio por trade:</span>
                  <div className={`font-medium text-sm ${
                    symbol.avg_pnl_per_trade >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${symbol.avg_pnl_per_trade.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;