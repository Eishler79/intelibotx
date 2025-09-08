import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  Zap,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import { getLiveTradingFeed } from "../services/api";

export default function LiveTradingFeed({ bots }) {
  const [activeBots, setActiveBots] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [timeFilter, setTimeFilter] = useState(24); // hours
  
  // 🔄 State para datos del feed
  const [feed, setFeed] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const runningBotIds = bots.filter(bot => bot.status === 'RUNNING').map(bot => bot.id).join(',');

  // Load feed data function
  const loadFeedData = async () => {
    if (!runningBotIds) {
      setFeed([]);
      setTotalCount(0);
      setTotalPages(1);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getLiveTradingFeed({
        page: currentPage,
        limit: pageSize,
        bot_ids: runningBotIds,
        hours: timeFilter
      });
      
      if (response.success) {
        setFeed(response.data?.operations || []);
        setTotalCount(response.data?.total_count || 0);
        setTotalPages(Math.ceil((response.data?.total_count || 0) / pageSize));
      } else {
        setError('Error cargando feed de trading');
      }
    } catch (err) {
      console.error('Error loading feed:', err);
      setError(err.message || 'Error conectando con API');
    } finally {
      setLoading(false);
    }
  };
  
  // Refetch function for manual refresh
  const refetch = () => {
    loadFeedData();
  };
  
  useEffect(() => {
    const runningBots = bots.filter(bot => bot.status === 'RUNNING');
    setActiveBots(runningBots);
  }, [bots]);
  
  // Load feed when dependencies change
  useEffect(() => {
    loadFeedData();
  }, [runningBotIds, currentPage, pageSize, timeFilter]);

  // Reset to page 1 when bots or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [runningBotIds, timeFilter, pageSize]);

  // ✅ BENEFICIO: Los trades ahora persisten entre sesiones

  const getTotalPnL = () => {
    return feed.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  };

  const getWinRate = () => {
    if (feed.length === 0) return 0;
    const profitable = feed.filter(t => t.pnl > 0).length;
    return ((profitable / feed.length) * 100).toFixed(1);
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages || 1, prev + 1));
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleTimeFilterChange = (hours) => {
    setTimeFilter(hours);
    setCurrentPage(1);
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="text-green-400" size={20} />
            Trading en Vivo
            {loading && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Zap size={12} className="mr-1" />
              {activeBots.length} Activos
            </Badge>
            <div className="text-right">
              <div className={`text-sm font-semibold ${
                getTotalPnL() >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {getTotalPnL() >= 0 ? '+' : ''}${getTotalPnL().toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">Win: {getWinRate()}%</div>
            </div>
          </div>
        </div>

        {/* 📊 Controles de filtrado y paginación */}
        <div className="flex justify-between items-center gap-4">
          {/* Filtros de tiempo */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Período:</span>
            {[1, 6, 24, 168].map(hours => (
              <Button
                key={hours}
                size="sm"
                variant={timeFilter === hours ? "default" : "outline"}
                onClick={() => handleTimeFilterChange(hours)}
                className="text-xs px-2 py-1"
              >
                {hours === 1 ? '1h' : hours === 6 ? '6h' : hours === 24 ? '1d' : '7d'}
              </Button>
            ))}
          </div>

          {/* Selector de elementos por página */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Info de paginación */}
          {totalCount > 0 && (
            <div className="text-sm text-gray-400">
              {((currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, totalCount)} de {totalCount}
            </div>
          )}
        </div>
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
            
            {/* 🔄 Estado de carga */}
            {loading && (
              <div className="text-center py-8 text-gray-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cargando operaciones...</span>
                </div>
                <p className="text-sm">Conectando con API persistente</p>
              </div>
            )}

            {/* 🚨 Estado de error */}
            {error && !loading && (
              <div className="text-center py-8 text-red-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span>❌ Error cargando operaciones</span>
                </div>
                <p className="text-xs">{error}</p>
                <button 
                  onClick={refetch}
                  className="mt-2 px-3 py-1 bg-red-500/20 rounded text-xs hover:bg-red-500/30"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* ✅ Datos de API persistente */}
            {!loading && !error && feed.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>No hay operaciones recientes</span>
                </div>
                <p className="text-sm">Los bots están analizando el mercado</p>
                <p className="text-xs mt-2 text-blue-400">✅ Datos persisten entre sesiones</p>
              </div>
            )}

            {!loading && !error && feed.length > 0 && (
              feed.map((trade) => (
                <div 
                  key={trade.id || trade.operation_id}
                  className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      (trade.pnl || 0) >= 0 ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">{trade.symbol || 'N/A'}</span>
                        <Badge 
                          className={`text-xs px-2 py-0 ${
                            (trade.side || 'BUY') === 'BUY' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {trade.side || 'BUY'}
                        </Badge>
                        {(trade.algorithm_used || trade.algorithm) && (
                          <span className="text-xs text-yellow-400 px-1 py-0 bg-yellow-400/10 rounded">
                            {trade.algorithm_used || trade.algorithm}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {trade.signal || 'N/A'} • {trade.strategy || 'Smart Scalper'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-semibold text-sm ${
                      (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {(trade.pnl || 0) >= 0 ? '+' : ''}${Number(trade.pnl || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {trade.time_ago || trade.created_at || 'Ahora'}
                    </div>
                    {(trade.confidence !== undefined && trade.confidence !== null) && (
                      <div className="text-xs text-blue-400">
                        {(trade.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* 📄 Controles de navegación de páginas */}
            {totalPages > 1 && !loading && !error && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1 mx-3">
                    {/* Páginas cercanas */}
                    {currentPage > 2 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(1)}
                          className="px-2"
                        >
                          1
                        </Button>
                        {currentPage > 3 && <MoreHorizontal size={16} className="text-gray-400" />}
                      </>
                    )}
                    
                    {currentPage > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-2"
                      >
                        {currentPage - 1}
                      </Button>
                    )}
                    
                    <Button size="sm" variant="default" className="px-2">
                      {currentPage}
                    </Button>
                    
                    {currentPage < totalPages && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-2"
                      >
                        {currentPage + 1}
                      </Button>
                    )}
                    
                    {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && <MoreHorizontal size={16} className="text-gray-400" />}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(totalPages)}
                          className="px-2"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight size={16} />
                  </Button>
                </div>

                {/* Refresh button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refetch}
                  className="flex items-center gap-1"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}