// ✅ Componente: BotList.tsx
// Renderiza una tabla con los bots existentes en forma de cards

"use client";

import React, { useEffect, useState } from "react";
import { fetchBots } from "@/services/api";
import { BotCard } from "./BotCard";

// 🧠 Definición del tipo de datos para un Bot
interface Bot {
  id: string;
  symbol: string;
  strategy: string;
  status: string;
  roi: number;
}

// 🚀 Componente principal
export const BotList: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);

  // 📡 Cargar bots desde la API al montar el componente
  useEffect(() => {
    const loadBots = async () => {
      try {
        const response = await fetchBots(); // ← ahora sí llama la función importada
        setBots(response);
      } catch (error) {
        console.error("❌ Error al obtener bots:", error);
      }
    };

    loadBots();
  }, []);

  // 🎨 Renderizado de cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {bots.map((bot) => (
        <BotCard key={bot.id} bot={bot} />
      ))}
    </div>
  );
};


