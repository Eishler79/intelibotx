/**
 * 🎯 useWebSocketRealtime - Hook para conexión WebSocket tiempo real
 * Maneja autenticación, suscripciones y datos Smart Scalper
 * 
 * Eduard Guzmán - InteliBotX
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocketRealtime = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [realtimeData, setRealtimeData] = useState({});
  const [connectionError, setConnectionError] = useState(null);
  const [subscriptions, setSubscriptions] = useState(new Set());
  
  const ws = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
  const WS_URL = BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');

  // Conectar WebSocket
  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('⚠️ No hay token de autenticación para WebSocket');
      return;
    }

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const wsUrl = `${WS_URL}/ws/realtime/${clientId}?token=${encodeURIComponent(token)}`;
    
    console.log('🔗 Conectando WebSocket:', wsUrl);

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket conectado');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // Autenticar después de conexión
        const authMessage = {
          action: 'authenticate',
          token: token
        };
        ws.current.send(JSON.stringify(authMessage));
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ Error parseando mensaje WebSocket:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        setIsConnected(false);
        setIsAuthenticated(false);

        // Intentar reconexión automática
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`🔄 Reintentando conexión (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          setTimeout(connect, reconnectDelay);
        } else {
          setConnectionError('Conexión WebSocket perdida después de varios intentos');
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        setConnectionError('Error de conexión WebSocket');
      };

    } catch (error) {
      console.error('❌ Error creando WebSocket:', error);
      setConnectionError('No se pudo crear conexión WebSocket');
    }
  }, [WS_URL]);

  // Manejar mensajes WebSocket
  const handleWebSocketMessage = useCallback((data) => {
    console.log('📨 Mensaje WebSocket recibido:', data.type, data);

    switch (data.type) {
      case 'authentication_success':
        console.log('✅ Autenticado correctamente como usuario:', data.user_id);
        setIsAuthenticated(true);
        break;

      case 'authentication_error':
      case 'authentication_required':
        console.error('❌ Error autenticación:', data.error || data.message);
        setIsAuthenticated(false);
        setConnectionError(data.error || data.message);
        break;

      case 'subscription_confirmed':
        console.log(`✅ Suscripción confirmada: ${data.symbol}`);
        setSubscriptions(prev => new Set([...prev, data.symbol]));
        break;

      case 'smart_scalper_update':
        console.log(`📊 Actualización Smart Scalper ${data.symbol}:`, data.data);
        setRealtimeData(prev => ({
          ...prev,
          [data.symbol]: {
            ...data.data,
            timestamp: data.data.timestamp || new Date().toISOString(),
            type: 'smart_scalper'
          }
        }));
        break;

      case 'indicators_response':
        console.log(`📈 Indicadores ${data.symbol}:`, data.data);
        if (data.data) {
          setRealtimeData(prev => ({
            ...prev,
            [`${data.symbol}_indicators`]: {
              ...data.data,
              timestamp: new Date().toISOString(),
              type: 'indicators'
            }
          }));
        }
        break;

      case 'subscription_error':
        console.error(`❌ Error suscripción ${data.symbol}:`, data.error);
        setConnectionError(`Error suscripción: ${data.error}`);
        break;

      case 'pong':
        // Respuesta a ping - mantener conexión viva
        break;

      default:
        console.log('📝 Mensaje WebSocket no manejado:', data.type, data);
    }
  }, []);

  // Suscribirse a símbolo
  const subscribe = useCallback((symbol, interval = '1m', strategy = 'Smart Scalper') => {
    if (!ws.current || !isConnected || !isAuthenticated) {
      console.warn('⚠️ WebSocket no conectado o autenticado para suscripción');
      return false;
    }

    const message = {
      action: 'subscribe',
      symbol: symbol.toUpperCase(),
      interval,
      strategy
    };

    console.log('📤 Suscribiendo a:', message);
    ws.current.send(JSON.stringify(message));
    return true;
  }, [isConnected, isAuthenticated]);

  // Desuscribirse de símbolo
  const unsubscribe = useCallback((symbol) => {
    if (!ws.current || !isConnected) {
      return false;
    }

    const message = {
      action: 'unsubscribe',
      symbol: symbol.toUpperCase()
    };

    ws.current.send(JSON.stringify(message));
    setSubscriptions(prev => {
      const newSubs = new Set(prev);
      newSubs.delete(symbol.toUpperCase());
      return newSubs;
    });
    
    return true;
  }, [isConnected]);

  // Obtener indicadores actuales
  const getIndicators = useCallback((symbol, interval = '1m') => {
    if (!ws.current || !isConnected || !isAuthenticated) {
      console.warn('⚠️ WebSocket no conectado para obtener indicadores');
      return false;
    }

    const message = {
      action: 'get_indicators',
      symbol: symbol.toUpperCase(),
      interval
    };

    ws.current.send(JSON.stringify(message));
    return true;
  }, [isConnected, isAuthenticated]);

  // Ping para mantener conexión
  const ping = useCallback(() => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify({ action: 'ping' }));
    }
  }, [isConnected]);

  // Desconectar
  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
    setIsAuthenticated(false);
    setSubscriptions(new Set());
    reconnectAttempts.current = maxReconnectAttempts; // Evitar reconexión automática
  }, []);

  // Reconectar manualmente
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  // Efectos
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      connect();
    }

    // Ping periódico para mantener conexión
    const pingInterval = setInterval(ping, 30000); // Cada 30 segundos

    // Cleanup
    return () => {
      clearInterval(pingInterval);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect, ping]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return {
    // Estado
    isConnected,
    isAuthenticated,
    connectionError,
    subscriptions: Array.from(subscriptions),
    realtimeData,
    
    // Acciones
    subscribe,
    unsubscribe,
    getIndicators,
    disconnect,
    reconnect,
    
    // Utilidades
    isSubscribed: (symbol) => subscriptions.has(symbol.toUpperCase()),
    getSymbolData: (symbol) => realtimeData[symbol.toUpperCase()],
    getIndicatorsData: (symbol) => realtimeData[`${symbol.toUpperCase()}_indicators`]
  };
};

export default useWebSocketRealtime;