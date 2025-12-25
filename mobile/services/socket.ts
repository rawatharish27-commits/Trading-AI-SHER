
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://your-sher-ai-instance.com';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
});

export const subscribeToSignals = (callback: (signal: any) => void) => {
  socket.on('ai_signal', callback);
  return () => socket.off('ai_signal');
};

export const subscribeToPrice = (symbol: string, callback: (price: number) => void) => {
  socket.on(`price_${symbol}`, callback);
  return () => socket.off(`price_${symbol}`);
};
