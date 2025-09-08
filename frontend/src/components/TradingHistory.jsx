import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const TradingHistory = ({ botId }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    symbol: 'all',
    strategy: 'all',
    timeframe: '30'
  });

  useEffect(() => {
    if (botId) {
      loadTradingData();
    }
  }, [botId, filters]);

  const loadTradingData = async () => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      // Cargar órdenes
      const ordersResponse = await fetch(`${API_BASE}/api/bots/${botId}/orders?limit=50`);
      const ordersData = await ordersResponse.json();
      setOrders(ordersData.orders || []);

      // Cargar trades
      const tradesResponse = await fetch(`${API_BASE}/api/bots/${botId}/trades?limit=50`);
      const tradesData = await tradesResponse.json();
      setTrades(tradesData.trades || []);

      // Cargar resumen
      const summaryResponse = await fetch(`${API_BASE}/api/bots/${botId}/trading-summary?days=${filters.timeframe}`);
      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary || null);

    } catch (error) {
      console.error('Error loading trading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE}/api/bots/${botId}/create-sample-data`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Datos de ejemplo creados exitosamente');
        loadTradingData(); // Recargar datos
      } else {
        alert('❌ Error creando datos de ejemplo');
      }
    } catch (error) {
      console.error('Error creating sample data:', error);
      alert('❌ Error creando datos de ejemplo');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'FILLED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'COMPLETED': 'bg-blue-100 text-blue-800',
      'OPEN': 'bg-orange-100 text-orange-800',
      'STOP_LOSS_HIT': 'bg-red-100 text-red-800',
      'TAKE_PROFIT_HIT': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSideBadgeColor = (side) => {
    return side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const formatPrice = (price) => {
    return price ? `$${parseFloat(price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8})}` : 'N/A';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const formatPnL = (pnl) => {
    if (!pnl && pnl !== 0) return 'N/A';
    const value = Number(pnl);
    if (isNaN(value)) return 'N/A';
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    const sign = value >= 0 ? '+' : '';
    return (
      <span className={color}>
        {sign}${Number(value).toFixed(4)}
      </span>
    );
  };

  const formatPnLPercentage = (pnl) => {
    if (!pnl && pnl !== 0) return 'N/A';
    const value = Number(pnl);
    if (isNaN(value)) return 'N/A';
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    const sign = value >= 0 ? '+' : '';
    return (
      <span className={color}>
        {sign}{Number(value).toFixed(2)}%
      </span>
    );
  };

  if (loading) {
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
      {/* Resumen de Performance */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{summary.summary.total_trades}</div>
              <p className="text-sm text-gray-600">Total Trades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{summary.summary.win_rate}%</div>
              <p className="text-sm text-gray-600">Win Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${summary.summary.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.summary.total_pnl}
              </div>
              <p className="text-sm text-gray-600">Total P&L</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{summary.summary.profit_factor}</div>
              <p className="text-sm text-gray-600">Profit Factor</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs y Filtros */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Button
                variant={activeTab === 'orders' ? 'default' : 'outline'}
                onClick={() => setActiveTab('orders')}
              >
                Órdenes ({orders.length})
              </Button>
              <Button
                variant={activeTab === 'trades' ? 'default' : 'outline'}
                onClick={() => setActiveTab('trades')}
              >
                Trades ({trades.length})
              </Button>
            </div>
            
            <div className="flex space-x-2">
              {(orders.length === 0 && trades.length === 0) && (
                <Button onClick={createSampleData} className="bg-blue-600 hover:bg-blue-700">
                  Crear Datos Demo
                </Button>
              )}
              <Button variant="outline" onClick={loadTradingData}>
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay órdenes registradas</p>
                  <Button onClick={createSampleData} className="mt-4 bg-blue-600 hover:bg-blue-700">
                    Crear Datos de Ejemplo
                  </Button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Símbolo</th>
                      <th className="text-left p-2">Dirección</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Cantidad</th>
                      <th className="text-left p-2">Precio</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Estrategia</th>
                      <th className="text-left p-2">Confianza</th>
                      <th className="text-left p-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono">{order.symbol}</td>
                        <td className="p-2">
                          <Badge className={getSideBadgeColor(order.side)}>
                            {order.side}
                          </Badge>
                        </td>
                        <td className="p-2 text-gray-600">{order.type}</td>
                        <td className="p-2">{parseFloat(order.quantity).toFixed(6)}</td>
                        <td className="p-2">{formatPrice(order.avg_fill_price || order.market_price_at_creation)}</td>
                        <td className="p-2">
                          <Badge className={getStatusBadgeColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-xs">{order.strategy_applied}</td>
                        <td className="p-2">{(order.confidence_level * 100).toFixed(1)}%</td>
                        <td className="p-2 text-xs">{formatDateTime(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'trades' && (
            <div className="overflow-x-auto">
              {trades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay trades completados</p>
                  <p className="text-xs mt-2">Los trades se crean cuando se ejecutan órdenes de compra y venta</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Símbolo</th>
                      <th className="text-left p-2">Estrategia</th>
                      <th className="text-left p-2">Precio Entrada</th>
                      <th className="text-left p-2">Precio Salida</th>
                      <th className="text-left p-2">Cantidad</th>
                      <th className="text-left p-2">P&L</th>
                      <th className="text-left p-2">P&L %</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Duración</th>
                      <th className="text-left p-2">Abierto</th>
                      <th className="text-left p-2">Cerrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr key={trade.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono">{trade.symbol}</td>
                        <td className="p-2 text-xs">{trade.strategy}</td>
                        <td className="p-2">{formatPrice(trade.entry_price)}</td>
                        <td className="p-2">{formatPrice(trade.exit_price)}</td>
                        <td className="p-2">{parseFloat(trade.quantity).toFixed(6)}</td>
                        <td className="p-2">{formatPnL(trade.realized_pnl || trade.unrealized_pnl)}</td>
                        <td className="p-2">{formatPnLPercentage(trade.pnl_percentage)}</td>
                        <td className="p-2">
                          <Badge className={getStatusBadgeColor(trade.status)}>
                            {trade.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {trade.duration_minutes ? `${trade.duration_minutes}m` : 'N/A'}
                        </td>
                        <td className="p-2 text-xs">{formatDateTime(trade.opened_at)}</td>
                        <td className="p-2 text-xs">{formatDateTime(trade.closed_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingHistory;