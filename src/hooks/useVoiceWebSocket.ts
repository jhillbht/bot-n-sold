import { useRef, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

export const useVoiceWebSocket = (onMessage: (data: any) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const initWebSocket = () => {
      console.log('Initializing WebSocket...');
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      wsRef.current = new WebSocket('wss://urdvklczigznduyzmgrf.functions.supabase.co/realtime-chat');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
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
        toast({
          title: "Connection Error",
          description: "Lost connection to the voice service. Please refresh the page.",
          variant: "destructive",
        });
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed, attempting to reconnect...');
        setTimeout(initWebSocket, 3000);
      };
    };

    initWebSocket();

    return () => {
      console.log('Cleaning up WebSocket...');
      wsRef.current?.close();
    };
  }, [onMessage, toast]);

  return wsRef;
};