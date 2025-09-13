import { useState, useRef, useCallback } from 'react';
import { useAuthDL008 } from "../../shared/hooks/useAuthDL008";

export const useWebSocketConnection = () => {
  // ✅ DL-008: Authentication Pattern Hook
  const { getAuthHeaders } = useAuthDL008();
  
  // WebSocket connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);

  // WebSocket references
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const pingInterval = useRef(null);
  const subscriptions = useRef(new Set());

  // Connection management
  const connect = useCallback((url) => {
    try {
      setConnectionStatus('connecting');
      setError(null);

      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (err) {
          console.error('❌ WebSocket message parse error:', err);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        cleanup();
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection error');
        setConnectionStatus('error');
      };

    } catch (err) {
      setError('Failed to create WebSocket connection');
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
    }
    cleanup();
  }, []);

  const cleanup = () => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    subscriptions.current.clear();
  };

  const sendMessage = useCallback((message) => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }, [isConnected]);

  const ping = useCallback(() => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, [isConnected]);

  const subscribe = useCallback((channel) => {
    subscriptions.current.add(channel);
    if (isConnected) {
      sendMessage({ type: 'subscribe', channel });
    }
  }, [isConnected, sendMessage]);

  const unsubscribe = useCallback((channel) => {
    subscriptions.current.delete(channel);
    if (isConnected) {
      sendMessage({ type: 'unsubscribe', channel });
    }
  }, [isConnected, sendMessage]);

  return {
    // State
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    ping,
    subscribe,
    unsubscribe,
    cleanup,
    
    // Refs
    subscriptions: subscriptions.current
  };
};