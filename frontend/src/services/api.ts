// src/services/api.ts
// 🔒 Enhanced with HTTP Interceptor for Token Expiration & Security

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://intelibotx-production.up.railway.app";

// Helper function para obtener token JWT (mejorada con HTTP Interceptor)
function getAuthHeaders() {
  const token = localStorage.getItem('intelibotx_token');
  if (!token) {
    console.error('No authentication token found - user needs to login');
    // HTTP Interceptor will handle this automatically now
    throw new Error('Authentication required - please login first');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Note: HTTP Interceptor now handles:
// - Token expiration detection and auto-logout
// - Rate limiting (429) responses with retry logic 
// - Backend custom error parsing (AuthenticationError, ValidationError)
// - Security header validation
// - User notifications for all error types

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
  const res = await fetch(`${BASE_URL}/api/bots`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Error al obtener bots");
  return safeJsonParse(res);
}

export async function createBot(data: any) {
  const res = await fetch(`${BASE_URL}/api/create-bot`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear bot");
  return safeJsonParse(res);
}

export async function runBacktest(botId: string) {
  const res = await fetch(`${BASE_URL}/api/backtest-results/${botId}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Error al ejecutar backtest");
  return safeJsonParse(res);
}

export async function runSmartTrade(symbol: string, scalperMode: boolean = true) {
  const res = await fetch(`${BASE_URL}/api/run-smart-trade/${symbol}?scalper_mode=${scalperMode}`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Error al ejecutar SmartTrade");
  return safeJsonParse(res);
}

export async function updateBot(botId: string, data: any) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar bot");
  return safeJsonParse(res);
}

export async function deleteBot(botId: string) {
  console.log('deleteBot called with botId:', botId);
  const res = await fetch(`${BASE_URL}/api/bots/${botId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Error al eliminar bot");
  return safeJsonParse(res);
}

export async function startBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}/start`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Error al iniciar bot");
  return safeJsonParse(res);
}

export async function pauseBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}/pause`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Error al pausar bot");
  return safeJsonParse(res);
}

// ============================================
// 🔄 TRADING OPERATIONS - APIs Persistentes
// ============================================

export async function createTradingOperation(operationData: any) {
  const res = await fetch(`${BASE_URL}/api/bots/${operationData.bot_id}/trading-operations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(operationData)
  });
  if (!res.ok) throw new Error("Error al crear operación de trading");
  return safeJsonParse(res);
}

export async function getBotTradingOperations(botId: string, options: any = {}) {
  const params = new URLSearchParams();
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.side) params.append('side', options.side);
  if (options.days) params.append('days', options.days.toString());

  const res = await fetch(`${BASE_URL}/api/bots/${botId}/trading-operations?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Error al obtener operaciones del bot");
  return safeJsonParse(res);
}

export async function getLiveTradingFeed(options: any = {}) {
  const params = new URLSearchParams();
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.bot_ids) params.append('bot_ids', options.bot_ids);
  if (options.hours) params.append('hours', options.hours.toString());

  const res = await fetch(`${BASE_URL}/api/trading-feed/live?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Error al obtener feed de trading en vivo");
  return safeJsonParse(res);
}

export async function stopBot(botId: string) {
  const res = await fetch(`${BASE_URL}/api/bots/${botId}/stop`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Error al detener bot");
  return safeJsonParse(res);
}