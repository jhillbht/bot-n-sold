import { useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

export const useVoiceWebSocket = (onMessage: (data: any) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectTimeoutRef = useRef<number | null>(null);
  const toastShownRef = useRef(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const initWebSocket = () => {
      console.log('Initializing WebSocket...');
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      // Reset toast state
      toastShownRef.current = false;

      wsRef.current = new WebSocket('wss://urdvklczigznduyzmgrf.functions.supabase.co/realtime-chat');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0;
        // Start the conversation
        wsRef.current?.send(JSON.stringify({
          type: 'input_text',
          text: "Hello! I'm here to help you with your business valuation. How can I assist you today?"
        }));
      };

      wsRef.current.onmessage = (event) => {
        console.log('Received message:', event.data);
        onMessage(JSON.parse(event.data));
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast({
            title: "Connection Error",
            description: "Lost connection to the voice service. Please refresh the page.",
            variant: "destructive",
            duration: 5000,
          });
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})...`);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(initWebSocket, 3000);
        } else if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast({
            title: "Connection Failed",
            description: "Unable to establish connection. Please refresh the page to try again.",
            variant: "destructive",
            duration: 5000,
          });
        }
      };
    };

    initWebSocket();

    return () => {
      console.log('Cleaning up WebSocket...');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [onMessage, toast]);

  return wsRef;
};