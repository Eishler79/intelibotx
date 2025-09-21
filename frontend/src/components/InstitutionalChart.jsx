import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Activity } from 'lucide-react';

const tooltipFormatter = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-md p-3 text-xs text-gray-100">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-blue-300">Price: ${row.price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? 'N/A'}</p>
      <p className="text-gray-300">Volume: {row.volume?.toLocaleString() ?? 'N/A'}</p>
      {row.wyckoffPhase && <p className="text-purple-300">Wyckoff: {row.wyckoffPhase}</p>}
    </div>
  );
};

const transformData = (raw = []) =>
  raw
    .map((item, index) => {
      const price = Number(item?.price ?? item?.close ?? item?.c);
      if (!Number.isFinite(price)) return null;
      const volume = Number(item?.volume ?? item?.v ?? item?.Volume);
      const timestamp = item?.time || item?.timestamp || item?.datetime;
      const timeLabel = timestamp
        ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        : `#${index + 1}`;
      return {
        ...item,
        time: timeLabel,
        price,
        volume: Number.isFinite(volume) ? volume : null
      };
    })
    .filter(Boolean);

const InstitutionalChart = ({
  symbol,
  interval,
  theme = 'dark',
  data = [],
  institutionalAnalysis = {},
  loading = false
}) => {
  const chartData = useMemo(() => transformData(data), [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-blue-300">
        <Activity className="animate-spin mr-2" size={18} /> Loading chart…
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-300">
        No market data available for {symbol} ({interval})
      </div>
    );
  }

  const colors = {
    primary: theme === 'dark' ? '#60A5FA' : '#1D4ED8',
    secondary: theme === 'dark' ? '#34D399' : '#047857',
    accent: theme === 'dark' ? '#F59E0B' : '#D97706'
  };


  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={colors.primary} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#D1D5DB'} />
        <XAxis dataKey="time" stroke={theme === 'dark' ? '#9CA3AF' : '#4B5563'} fontSize={12} interval="preserveStartEnd" />
        <YAxis yAxisId="price" stroke={theme === 'dark' ? '#9CA3AF' : '#4B5563'} fontSize={12} domain={['dataMin * 0.99', 'dataMax * 1.01']} />
        <YAxis yAxisId="volume" orientation="right" stroke={theme === 'dark' ? '#6B7280' : '#9CA3AF'} fontSize={12} hide />
        <Tooltip content={tooltipFormatter} />
        <Legend verticalAlign="top" height={32} iconType="circle" />
        <Area yAxisId="price" type="monotone" dataKey="price" stroke={colors.primary} strokeWidth={2} fill="url(#priceGradient)" name="Price" />
        <Bar yAxisId="volume" dataKey="volume" fill={colors.secondary} opacity={0.4} name="Volume" />

        {/* Default institutional overlays (Smart Scalper + others) */}
        <Line yAxisId="price" dataKey="orderBlocks" stroke={colors.accent} strokeDasharray="5 5" dot={false} name="Order Blocks" />
        <Line yAxisId="price" dataKey="liquidityGrabs" stroke="#EF4444" strokeDasharray="4 4" dot={false} name="Liquidity Grabs" />
        <Line yAxisId="price" dataKey="stopHunting" stroke="#A855F7" strokeDasharray="2 6" dot={false} name="Stop Hunting" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default InstitutionalChart;
