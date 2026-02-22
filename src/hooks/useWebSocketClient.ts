"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  url?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  subscribe: (channel: string, callback: (data: unknown) => void) => void;
  unsubscribe: (channel: string) => void;
  emit: (event: string, data: unknown) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket({
  url = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000",
  onConnect,
  onDisconnect,
  onError,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
}: UseWebSocketOptions = {}): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const reconnectCount = useRef(0);
  const subscriptions = useRef<Map<string, (data: unknown) => void>>(new Map());

  const connect = useCallback(() => {
    if (socket?.connected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    const newSocket = io(url, {
      transports: ["websocket"],
      reconnection: false, // We handle reconnection manually
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectCount.current = 0;
      
      // Resubscribe to channels
      subscriptions.current.forEach((callback, channel) => {
        newSocket.emit("subscribe", { channel });
      });

      onConnect?.();
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      onDisconnect?.();

      // Attempt reconnection
      if (reconnectCount.current < reconnectAttempts) {
        reconnectCount.current++;
        setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    });

    newSocket.on("connect_error", (err) => {
      setIsConnecting(false);
      setError(err);
      onError?.(err);

      // Attempt reconnection
      if (reconnectCount.current < reconnectAttempts) {
        reconnectCount.current++;
        setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    });

    // Handle subscribed channel messages
    subscriptions.current.forEach((callback, channel) => {
      newSocket.on(channel, callback);
    });

    setSocket(newSocket);
  }, [url, onConnect, onDisconnect, onError, reconnectAttempts, reconnectInterval, socket?.connected, isConnecting]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectCount.current = 0;
    connect();
  }, [disconnect, connect]);

  const subscribe = useCallback((channel: string, callback: (data: unknown) => void) => {
    subscriptions.current.set(channel, callback);
    
    if (socket?.connected) {
      socket.emit("subscribe", { channel });
      socket.on(channel, callback);
    }
  }, [socket]);

  const unsubscribe = useCallback((channel: string) => {
    subscriptions.current.delete(channel);
    
    if (socket?.connected) {
      socket.emit("unsubscribe", { channel });
      socket.off(channel);
    }
  }, [socket]);

  const emit = useCallback((event: string, data: unknown) => {
    if (socket?.connected) {
      socket.emit(event, data);
    }
  }, [socket]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    subscribe,
    unsubscribe,
    emit,
    disconnect,
    reconnect,
  };
}

// Hook for real-time market data
export function useMarketData(symbol: string) {
  const { socket, isConnected, subscribe, unsubscribe } = useWebSocket();
  const [quote, setQuote] = useState<{
    symbol: string;
    ltp: number;
    change: number;
    changePercent: number;
    volume: number;
  } | null>(null);

  useEffect(() => {
    if (!symbol || !isConnected) return;

    const channel = `quote:${symbol}`;
    
    subscribe(channel, (data: unknown) => {
      setQuote(data as typeof quote);
    });

    return () => {
      unsubscribe(channel);
    };
  }, [symbol, isConnected, subscribe, unsubscribe]);

  return { quote, isConnected };
}

// Hook for real-time signals
export function useRealtimeSignals() {
  const { socket, isConnected, subscribe, unsubscribe } = useWebSocket();
  const [signals, setSignals] = useState<Array<{
    id: string;
    symbol: string;
    action: string;
    probability: number;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    if (!isConnected) return;

    const channel = "signals:new";
    
    subscribe(channel, (data: unknown) => {
      setSignals((prev) => [data as typeof signals[0], ...prev].slice(0, 50));
    });

    return () => {
      unsubscribe(channel);
    };
  }, [isConnected, subscribe, unsubscribe]);

  return { signals, isConnected };
}
