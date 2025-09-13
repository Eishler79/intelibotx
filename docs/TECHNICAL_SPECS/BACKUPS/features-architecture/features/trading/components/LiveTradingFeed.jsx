import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Clock,
  Zap,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { usePagination } from "../hooks/usePagination";
import { useTimeFilters } from "../hooks/useTimeFilters";
import { useLiveFeed } from "../hooks/useLiveFeed";
import { useTradingCalculations } from "../hooks/useTradingCalculations";
import { TradeCard } from "./TradeCard";
import { PaginationControls } from "./PaginationControls";
import { FeedFilters } from "./FeedFilters";
import { FeedStates } from "./FeedStates";

export default function LiveTradingFeed({ bots }) {
  const [activeBots, setActiveBots] = useState([]);
  
  // ✅ Specialized hooks - no wrappers, direct composition
  const pagination = usePagination(20);
  const timeFilters = useTimeFilters(24);
  const liveFeed = useLiveFeed();
  const calculations = useTradingCalculations(liveFeed.feed);
  
  // Running bots filter
  const runningBotIds = bots.filter(bot => bot.status === 'RUNNING').map(bot => bot.id).join(',');

  // Load feed data with all parameters
  const loadFeedData = async () => {
    if (!runningBotIds) {
      liveFeed.clearFeed();
      pagination.updateTotalCount(0);
      return;
    }
    
    try {
      const response = await liveFeed.loadFeedData({
        page: pagination.currentPage,
        limit: pagination.pageSize,
        bot_ids: runningBotIds,
        hours: timeFilters.timeFilter
      });
      
      pagination.updateTotalCount(response.data?.total_count || 0);
    } catch (err) {
      // Error handled in useLiveFeed
    }
  };
  
  // Manual refresh
  const refetch = () => {
    loadFeedData();
  };

  // Update active bots when bots change
  useEffect(() => {
    const runningBots = bots.filter(bot => bot.status === 'RUNNING');
    setActiveBots(runningBots);
  }, [bots]);

  // Load feed when dependencies change
  useEffect(() => {
    loadFeedData();
  }, [runningBotIds, pagination.currentPage, pagination.pageSize, timeFilters.timeFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    pagination.resetPagination();
  }, [runningBotIds, timeFilters.timeFilter, pagination.pageSize]);

  return (
    <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="text-green-400" size={20} />
            Trading en Vivo
            {liveFeed.loading && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Zap size={12} className="mr-1" />
              {activeBots.length} Activos
            </Badge>
            <div className="text-right">
              <div className={`text-sm font-semibold ${
                calculations.isPositivePnL ? 'text-green-400' : 'text-red-400'
              }`}>
                {calculations.formattedPnL}
              </div>
              <div className="text-xs text-gray-400">Win: {calculations.formattedWinRate}</div>
            </div>
          </div>
        </div>

        {/* 📊 Controles de filtrado y paginación */}
        <FeedFilters timeFilters={timeFilters} pagination={pagination} />
      </CardHeader>
      
      <CardContent>
        {activeBots.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Activity size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No hay bots activos</p>
            <p className="text-sm">Inicia un bot para ver las operaciones en tiempo real</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <FeedStates liveFeed={liveFeed} onRefresh={refetch} />
            
            {liveFeed.hasFeed && (
              liveFeed.feed.map((trade) => (
                <TradeCard key={trade.id || trade.operation_id} trade={trade} />
              ))
            )}

            <PaginationControls 
              pagination={pagination}
              loading={liveFeed.loading}
              onRefresh={refetch}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}