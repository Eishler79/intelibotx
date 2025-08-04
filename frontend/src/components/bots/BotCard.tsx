// ✅ Componente: BotCard.tsx
// Muestra resumen individual de cada bot en una card estilizada, con botón para lanzar backtest

"use client";

import React, { useState } from "react";
import { runBacktest } from "@/services/api";
import { Button } from "@/components/ui/button";

// 🧠 Tipo de datos para un Bot
interface Bot {
  id: string;
  symbol: string;
  strategy: string;
  status: string;
  roi: number;
}

// 🎯 Props esperadas por el componente
interface Props {
  bot: Bot;
}

// 🎨 Componente visual
export const BotCard: React.FC<Props> = ({ bot }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // ⚙️ Lógica para ejecutar el backtest
  const handleBacktest = async () => {
    try {
      setLoading(true);
      setResult(null);
      const data = await runBacktest(bot.id);
      setResult(`✔️ Ganancia total: $${data.total_profit} | Winrate: ${data.winrate}%`);
    } catch (err) {
      setResult("❌ Error al ejecutar backtest");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary text-white p-4 rounded-xl shadow-md hover:scale-[1.01] transition-transform">
      <h3 className="text-xl font-semibold mb-2">{bot.symbol}</h3>
      <p>🧠 Estrategia: <strong>{bot.strategy}</strong></p>
      <p>📊 ROI: <strong>{bot.roi}%</strong></p>
      <p>🔄 Estado: <strong>{bot.status}</strong></p>

      {/* 🚀 Botón para lanzar backtest */}
      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={handleBacktest} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
          {loading ? "Procesando..." : "Iniciar Backtest"}
        </Button>

        {/* 📈 Resultado mostrado en texto */}
        {result && (
          <div className="text-sm text-green-400 font-mono bg-black/30 p-2 rounded">
            {result}
          </div>
        )}
      </div>
    </div>
  );
};