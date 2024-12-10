import { useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export const useVapiWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    wsRef.current = new WebSocket(`wss://urdvklczigznduyzmgrf.functions.supabase.co/realtime-chat`);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      toast({
        title: "Welcome to Bot & Sold",
        description: "I'm your AI business advisor. How can I help you today? For example, I can assist with business valuations or guide you through selling your business.",
      });
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  return wsRef;
};