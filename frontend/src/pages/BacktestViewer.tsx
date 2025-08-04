import React from "react";

const BacktestViewer = ({ symbol = "BTCUSDT" }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://intelibotx-api.up.railway.app";
  console.log("BACKEND_URL:", import.meta.env.VITE_BACKEND_URL);

  return (
    <div className="w-full h-[85vh] bg-black p-4">
      <h2 className="text-xl text-white mb-4">Gráfico de Backtest para {symbol}</h2>
      <iframe
        src={`${backendUrl}/api/backtest-plot/${symbol}`}
        title="Gráfico de Backtest"
        className="w-full h-full border-2 border-gray-800 rounded-xl"
      ></iframe>
    </div>
  );
};

export default BacktestViewer;