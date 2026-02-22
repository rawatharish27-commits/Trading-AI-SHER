'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage, QuoteUpdate } from '@/types/market';
import { useMarketStore } from '@/store/useMarketStore';
import { useSignalStore } from '@/store/useSignalStore';
import { Signal } from '@/types/signal';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const updateQuoteFromSocket = useMarketStore((s) => s.updateQuoteFromSocket);
  const addSignal = useSignalStore((s) => s.addSignal);
  const updateSignal = useSignalStore((s) => s.updateSignal);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('accessToken') 
      : null;

    socketRef.current = io(WS_URL, {
      path: '/ws',
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      onConnect?.();
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      onDisconnect?.();
    });

    socketRef.current.on('connect_error', (error) => {
      onError?.(error);
    });

    socketRef.current.on('reconnecting', () => {
      setIsReconnecting(true);
    });

    // Handle real-time quote updates
    socketRef.current.on('message', (message: WebSocketMessage) => {
      switch (message.type) {
        case 'QUOTE':
          updateQuoteFromSocket(message.data as QuoteUpdate);
          break;
        case 'SIGNAL':
          const signal = message.data as Signal;
          // Check if it's a new signal or update
          const existingSignals = useSignalStore.getState().signals;
          if (existingSignals.some((s) => s.id === signal.id)) {
            updateSignal(signal.id, signal);
          } else {
            addSignal(signal);
          }
          break;
        default:
          break;
      }
    });

    socketRef.current.on('heartbeat', () => {
      // Respond to server heartbeat
      socketRef.current?.emit('heartbeat_response');
    });
  }, [onConnect, onDisconnect, onError, updateQuoteFromSocket, addSignal, updateSignal]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const subscribe = useCallback((channel: string, params?: Record<string, unknown>) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', { channel, ...params });
    }
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', { channel });
    }
  }, []);

  const send = useCallback((event: string, data: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isReconnecting,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    socket: socketRef.current,
  };
}
