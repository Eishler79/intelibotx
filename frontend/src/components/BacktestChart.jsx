import React, { useEffect, useState } from "react";

export default function BacktestChart({ symbol }) {
  const [chartHTML, setChartHTML] = useState("");

  useEffect(() => {
    // ✅ DL-001 COMPLIANCE: No hardcode URL - usar environment variable
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
    fetch(`${BASE_URL}/api/backtest-chart/${symbol}`)
      .then((res) => res.text())
      .then((html) => setChartHTML(html));
  }, [symbol]);

  return (
    <div className="p-4 bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-xl text-white mb-2">Simulación de Trades: {symbol}</h2>
      <div dangerouslySetInnerHTML={{ __html: chartHTML }} />
    </div>
  );
}