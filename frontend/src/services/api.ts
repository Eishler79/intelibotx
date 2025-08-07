// src/services/api.ts

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://intelibotx-production.up.railway.app";

// Helper function para manejar respuestas JSON de forma segura
async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON Parse Error:', text);
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
  }
}

export async function fetchBots() {
  const res = await fetch(`${BASE_URL}/api/bots`);
  if (!res.ok) throw new Error("Error al obtener bots");
  return safeJsonParse(res);
}

export async function createBot(data: any) {
  const res = await fetch(`${BASE_URL}/api/create-bot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear bot");
  return safeJsonParse(res);
}

export async function runBacktest(botId: string) {
  const res = await fetch(`${BASE_URL}/api/backtest-results/${botId}`);
  if (!res.ok) throw new Error("Error al ejecutar backtest");
  return safeJsonParse(res);
}

export async function runSmartTrade(symbol: string) {
  const res = await fetch(`${BASE_URL}/api/run-smart-trade/${symbol}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) throw new Error("Error al ejecutar SmartTrade");
  return safeJsonParse(res);
}

export async function updateBot(botId: string, data: any) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar bot");
  return safeJsonParse(res);
}

export async function deleteBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar bot");
  return safeJsonParse(res);
}

export async function startBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}/start`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Error al iniciar bot");
  return safeJsonParse(res);
}

export async function pauseBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}/pause`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Error al pausar bot");
  return safeJsonParse(res);
}

export async function stopBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}/stop`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Error al detener bot");
  return safeJsonParse(res);
}