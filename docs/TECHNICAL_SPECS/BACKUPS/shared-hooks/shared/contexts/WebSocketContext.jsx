import React, { createContext, useContext, useEffect } from 'react';
import { useWebSocketConnection } from '../hooks/useWebSocketConnection';
import websocketService from '../services/websocketService';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children, baseUrl }) => {
  const connection = useWebSocketConnection();

  // Initialize WebSocket service
  useEffect(() => {
    if (baseUrl) {
      const channelId = 'main';
      const ws = websocketService.connect(baseUrl, channelId);
      
      if (ws) {
        connection.connect(websocketService.createWebSocketURL(baseUrl));
      }

      return () => {
        websocketService.disconnect(channelId);
        connection.disconnect();
      };
    }
  }, [baseUrl, connection]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      websocketService.disconnectAll();
      connection.cleanup();
    };
  }, [connection]);

  // Context value
  const contextValue = {
    // Connection state
    ...connection,
    
    // Service methods
    service: websocketService,
    
    // Helper methods
    subscribeToChannel: (channel, callback) => {
      return websocketService.subscribe(channel, callback);
    },
    
    sendToChannel: (channel, message) => {
      return websocketService.send(channel, message);
    },
    
    getChannelStatus: (channel) => {
      return websocketService.getStatus(channel);
    }
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};