import { useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VapiConnectionManager } from '@/utils/vapiConnection';

export const useVapiWebSocket = () => {
  const wsManagerRef = useRef<VapiConnectionManager | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    const handleError = (error: Event) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Attempting alternative connection methods...",
        variant: "destructive",
      });
    };

    const connectToVapi = async () => {
      try {
        wsManagerRef.current = new VapiConnectionManager(
          () => console.log('Connected to VAPI'),
          handleMessage,
          handleError,
          () => console.log('Connection closed')
        );

        const ws = await wsManagerRef.current.connect();
        if (ws) {
          wsRef.current = ws;
        }
      } catch (error) {
        console.error('Failed to establish connection:', error);
        toast({
          title: "Connection Failed",
          description: "Could not establish connection to voice service.",
          variant: "destructive",
        });
      }
    };

    connectToVapi();

    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.close();
      }
    };
  }, [toast]);

  return wsRef;
};