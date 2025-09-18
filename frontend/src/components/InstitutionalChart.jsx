/**
 * 🏛️ InstitutionalChart - Gráfico Institucional Robusto
 * 
 * SPEC_REF: DL-002 Institutional Algorithm Data Visualization
 * REPLACEMENT: TradingViewWidget.jsx (elimina errores JavaScript)
 * TECHNOLOGY: Recharts (stable, no external scripts, institutional data focus)
 * 
 * PHILOSOPHY: Bot Único institutional transparency with real market microstructure data
 * ALGORITHMS: Wyckoff, Order Blocks, Liquidity Grabs, Stop Hunting visualization
 * 
 * Eduard Guzmán - InteliBotX
 */

import React, { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const InstitutionalChart = ({ 
  symbol = "BTCUSDT", 
  interval = "15m", 
  theme = "dark",
  data = [],
  institutionalAnalysis = {}
}) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(null);

  // 🏛️ Transform real trading data into institutional visualization
  useEffect(() => {
    setLoading(true);

    if (!Array.isArray(data) || data.length === 0) {
      setChartData([]);
      setCurrentPrice(null);
      setLoading(false);
      return;
    }

    const transformedData = data
      .map((item, index) => {
        const rawPrice = item?.price ?? item?.close ?? item?.c;
        const price = rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : null;

        const rawVolume = item?.volume ?? item?.v;
        const volume = rawVolume !== undefined && rawVolume !== null ? Number(rawVolume) : null;

        const timestamp = item?.timestamp ?? item?.time;
        let timeLabel;

        if (timestamp !== undefined && timestamp !== null) {
          const date = new Date(timestamp);
          timeLabel = Number.isNaN(date.getTime())
            ? String(timestamp)
            : date.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              });
        } else {
          timeLabel = `#${index + 1}`;
        }

        return {
          time: timeLabel,
          price,
          volume,
          orderBlocks: item?.order_blocks ?? null,
          liquidityGrabs: item?.liquidity_grabs ?? null,
          stopHunting: item?.stop_hunting ?? null,
          wyckoffPhase: item?.wyckoff_phase ?? null
        };
      })
      .filter((point) => point.price !== null);

    setChartData(transformedData);
    setCurrentPrice(transformedData.length > 0 ? transformedData[transformedData.length - 1].price : null);
    setLoading(false);
  }, [data, symbol, interval]);

  // 🎯 Custom Tooltip for Institutional Data
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{`Time: ${label}`}</p>
          <p className="text-blue-400">{`Price: $${data.price !== null && data.price !== undefined ? Number(data.price).toLocaleString() : 'N/A'}`}</p>
          <p className="text-gray-400">{`Volume: ${data.volume !== null && data.volume !== undefined ? Number(data.volume).toLocaleString() : 'N/A'}`}</p>
          
          {data.orderBlocks !== null && data.orderBlocks !== undefined && (
            <p className="text-orange-400">🏛️ Order Block: ${Number(data.orderBlocks).toFixed(2)}</p>
          )}
          {data.liquidityGrabs !== null && data.liquidityGrabs !== undefined && (
            <p className="text-red-400">🎯 Liquidity Grab: ${Number(data.liquidityGrabs).toFixed(2)}</p>
          )}
          {data.stopHunting !== null && data.stopHunting !== undefined && (
            <p className="text-yellow-400">⚡ Stop Hunting: ${Number(data.stopHunting).toFixed(2)}</p>
          )}
          
          <p className="text-purple-400 mt-2">📈 Wyckoff: {data.wyckoffPhase || 'N/A'}</p>
        </div>
      );
    }
    return null;
  };

  // 🎨 Theme colors for institutional chart
  const colors = {
    primary: theme === 'dark' ? '#60A5FA' : '#3B82F6',
    secondary: theme === 'dark' ? '#34D399' : '#10B981',
    warning: theme === 'dark' ? '#FBBF24' : '#F59E0B',
    danger: theme === 'dark' ? '#F87171' : '#EF4444',
    grid: theme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.3)',
    background: theme === 'dark' ? '#1F2937' : '#FFFFFF'
  };

  if (loading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <Activity className="animate-spin mr-2" size={24} />
            <span className="text-gray-400">Loading Institutional Analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96 text-gray-400">
            No data available for {symbol} ({interval})
          </div>
        </CardContent>
      </Card>
    );
  }

  const basePrice = chartData.length > 0 ? chartData[0].price : null;
  const priceChange = basePrice && basePrice !== 0 && currentPrice !== null
    ? ((currentPrice - basePrice) / basePrice) * 100
    : 0;

  return (
    <Card className="bg-gray-800/50 border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            🏛️ {symbol} - Institutional Analysis
            <Badge 
              variant={priceChange >= 0 ? "success" : "destructive"}
              className={`${priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
            >
              {priceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {priceChange.toFixed(2)}%
            </Badge>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {currentPrice !== null && currentPrice !== undefined ? `$${Number(currentPrice).toLocaleString()}` : '—'}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* 📊 Main Price Chart with Institutional Overlays */}
        <div className="h-96 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="time" 
                stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} 
                fontSize={12}
                domain={['dataMin - 100', 'dataMax + 100']}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* 📈 Main Price Line */}
              <Area
                type="monotone"
                dataKey="price"
                stroke={colors.primary}
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
              
              {/* 🏛️ Order Blocks */}
              <Line
                type="monotone"
                dataKey="orderBlocks"
                stroke={colors.warning}
                strokeWidth={2}
                dot={{ fill: colors.warning, strokeWidth: 2, r: 4 }}
                connectNulls={false}
                strokeDasharray="5 5"
              />
              
              {/* 🎯 Liquidity Grabs */}
              <Line
                type="monotone"
                dataKey="liquidityGrabs"
                stroke={colors.danger}
                strokeWidth={2}
                dot={{ fill: colors.danger, strokeWidth: 2, r: 3 }}
                connectNulls={false}
                strokeDasharray="2 2"
              />
              
              {/* ⚡ Stop Hunting Levels */}
              <Line
                type="monotone"
                dataKey="stopHunting"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 3 }}
                connectNulls={false}
                strokeDasharray="8 2"
              />
              
              {/* Volume Bars */}
              <Bar 
                dataKey="volume" 
                fill={colors.secondary} 
                opacity={0.3} 
                yAxisId="volume"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 🏛️ Institutional Analysis Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-orange-400 mb-1">
              <span className="text-xs">🏛️</span>
              <span className="text-sm font-medium">Order Blocks</span>
            </div>
            <div className="text-lg font-bold text-white">
              {chartData.filter(d => d.orderBlocks).length}
            </div>
            <div className="text-xs text-gray-400">Active Levels</div>
          </div>
          
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <span className="text-xs">🎯</span>
              <span className="text-sm font-medium">Liquidity</span>
            </div>
            <div className="text-lg font-bold text-white">
              {chartData.filter(d => d.liquidityGrabs).length}
            </div>
            <div className="text-xs text-gray-400">Grab Points</div>
          </div>
          
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <span className="text-xs">⚡</span>
              <span className="text-sm font-medium">Stop Hunt</span>
            </div>
            <div className="text-lg font-bold text-white">
              {chartData.filter(d => d.stopHunting).length}
            </div>
            <div className="text-xs text-gray-400">Events</div>
          </div>
          
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <span className="text-xs">📈</span>
              <span className="text-sm font-medium">Wyckoff</span>
            </div>
            <div className="text-lg font-bold text-white">
              {chartData[chartData.length - 1]?.wyckoffPhase || 'N/A'}
            </div>
            <div className="text-xs text-gray-400">Current Phase</div>
          </div>
        </div>

        {/* 🔍 Technical Note */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-blue-400">
            📊 <strong>Institutional Chart:</strong> Visualizing market microstructure with Order Blocks (🏛️), 
            Liquidity Grabs (🎯), Stop Hunting (⚡), and Wyckoff Method analysis. 
            Stable React-based implementation replaces external TradingView widget.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstitutionalChart;
