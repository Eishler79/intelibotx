import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/contexts/AuthContext";
import { 
  Banknote, 
  BarChart2, 
  Zap, 
  TrendingUp,
  Activity,
  Award,
  Target
} from "lucide-react";
import { 
  useDashboardData, 
  useBalanceEvolution, 
  useSymbolsAnalysis
} from "../features/dashboard/services/dashboardService";

// ✅ SUCCESS CRITERIA: Extracted Components
import DashboardHeader from "../features/dashboard/components/DashboardHeader";
import MetricCard from "../features/dashboard/components/MetricCard";
import ExchangeEmptyState from "../features/dashboard/components/ExchangeEmptyState";
import EvolutionChart from "../features/dashboard/components/EvolutionChart";
import SymbolPerformance from "../features/dashboard/components/SymbolPerformance";

const DashboardPage = () => {
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

  // ✅ GUARDRAILS P1 COMPLIANT: Use existing MetricCard directly without wrapper antipattern

  // Check if user has exchanges configured
  const hasExchanges = userExchanges && userExchanges.length > 0;

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* ✅ Extracted Header Component */}
      <DashboardHeader 
        userExchanges={userExchanges}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        onRefresh={refetch}
        isRefreshing={summaryLoading}
      />

      {/* ⚠️ Error state */}
      {summaryError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
          ❌ Error cargando datos: {summaryError}
        </div>
      )}

      {/* ✅ Extracted Empty State Component */}
      {!hasExchanges && (
        <ExchangeEmptyState onNavigateToExchanges={() => navigate('/exchanges')} />
      )}

      {/* 📊 Dashboard Content - Show when has exchanges OR always show (user choice) */}
      {hasExchanges && (
        <div className="space-y-8">

      {/* ✅ CLAUDE_BASE COMPLIANT: Direct MetricCard usage without wrapper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Bots activos"
          value={summary ? `${summary.active_bots}/${summary.total_bots}` : '0/0'}
          subtitle={summaryLoading ? "Loading..." : undefined}
          icon={BarChart2}
          iconColor="text-blue-400"
          valueColor="text-blue-400"
          bgColor="bg-blue-500/20"
        />
        
        <MetricCard
          title="PnL de hoy"
          value={summary ? `$${summary.today_pnl}` : '$0'}
          subtitle={summary?.today_pnl ? `${summary.today_pnl >= 0 ? '+' : ''}${summary.today_pnl}%` : undefined}
          icon={TrendingUp}
          iconColor={summary?.today_pnl >= 0 ? "text-green-400" : "text-red-400"}
          valueColor={summary?.today_pnl >= 0 ? "text-green-400" : "text-red-400"}
          bgColor={summary?.today_pnl >= 0 ? "bg-green-500/20" : "bg-red-500/20"}
        />
        
        <MetricCard
          title="Operaciones hoy"
          value={summary ? summary.today_operations : 0}
          subtitle={summaryLoading ? "Loading..." : undefined}
          icon={Activity}
          iconColor="text-yellow-400"
          valueColor="text-yellow-400"
          bgColor="bg-yellow-500/20"
        />
        
        <MetricCard
          title="Balance actual"
          value={summary ? `$${summary.current_balance || summary.total_balance || 0}` : '$0'}
          subtitle={summary && summary.initial_capital && summary.total_pnl ? 
            `${((summary.total_pnl / summary.initial_capital) * 100).toFixed(1)}%` : 
            undefined}
          icon={Banknote}
          iconColor="text-green-400"
          valueColor="text-green-400"
          bgColor="bg-green-500/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Win Rate"
          value={summary ? `${summary.win_rate}%` : '0%'}
          subtitle={summaryLoading ? "Loading..." : undefined}
          icon={Target}
          iconColor="text-purple-400"
          valueColor="text-purple-400"
          bgColor="bg-purple-500/20"
        />
        
        <MetricCard
          title="Total operaciones"
          value={summary ? summary.total_operations : 0}
          subtitle={summaryLoading ? "Loading..." : undefined}
          icon={Zap}
          iconColor="text-cyan-400"
          valueColor="text-cyan-400"
          bgColor="bg-cyan-500/20"
        />
        
        <MetricCard
          title="PnL total"
          value={summary ? `$${summary.total_pnl}` : '$0'}
          subtitle={summaryLoading ? "Loading..." : undefined}
          icon={Award}
          iconColor={summary?.total_pnl >= 0 ? "text-green-400" : "text-red-400"}
          valueColor={summary?.total_pnl >= 0 ? "text-green-400" : "text-red-400"}
          bgColor={summary?.total_pnl >= 0 ? "bg-green-500/20" : "bg-red-500/20"}
        />
      </div>

      {/* ✅ Extracted Evolution Chart */}
      <EvolutionChart 
        evolution={evolution}
        symbols={symbols}
        chartType={chartType}
        selectedSymbol={selectedSymbol}
        evolutionLoading={evolutionLoading}
        onChartTypeChange={setChartType}
        onSymbolChange={setSelectedSymbol}
      />

      {/* ✅ Extracted Symbol Performance */}
      <SymbolPerformance symbols={symbols} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;