import { useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useVapiWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    const connectWebSocket = () => {
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice chat. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log('Attempting to connect to WebSocket...');
      wsRef.current = new WebSocket(`wss://urdvklczigznduyzmgrf.functions.supabase.co/realtime-chat`);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        reconnectAttemptsRef.current = 0;
        toast({
          title: "Connected",
          description: "Voice chat is ready. Start speaking to interact.",
        });
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        reconnectAttemptsRef.current++;
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        
        // Attempt to reconnect after a delay that increases with each attempt
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return wsRef;
};