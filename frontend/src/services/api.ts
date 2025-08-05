// src/services/api.ts

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://intelibotx-production.up.railway.app";

export async function fetchBots() {
  const res = await fetch(`${BASE_URL}/api/bots`);
  if (!res.ok) throw new Error("Error al obtener bots");
  return res.json();
}

export async function createBot(data: any) {
  const res = await fetch(`${BASE_URL}/api/create-bot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear bot");
  return res.json();
}

export async function runBacktest(botId: string) {
  const res = await fetch(`${BASE_URL}/api/backtest-results/${botId}`);
  if (!res.ok) throw new Error("Error al ejecutar backtest");
  return res.json();
}

export async function runSmartTrade(symbol: string) {
  const res = await fetch(`${BASE_URL}/api/run-smart-trade/${symbol}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) throw new Error("Error al ejecutar SmartTrade");
  return res.json();
}

export async function updateBot(botId: string, data: any) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar bot");
  return res.json();
}

export async function deleteBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar bot");
  return res.json();
}

export async function startBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}/start`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Error al iniciar bot");
  return res.json();
}

export async function pauseBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}/pause`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Error al pausar bot");
  return res.json();
}

export async function stopBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}/stop`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Error al detener bot");
  return res.json();
}