import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useVoiceWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    console.info('Initializing WebSocket connection...');
    
    try {
      const ws = new WebSocket(
        'wss://api.vapi.ai/ws?demo=true&shareKey=8b172799-931a-4e4e-be97-b2291b0b6434&assistantId=03c8458b-0abb-4d0a-98f6-456f99cb5000'
      );

      ws.onopen = () => {
        console.info('WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Send initial configuration
        ws.send(JSON.stringify({
          type: 'config',
          data: {
            sample_rate: 16000,
            encoding: 'audio/webm',
            languageCode: 'en-US'
          }
        }));
      };

      ws.onclose = (event) => {
        console.info('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);

        // Attempt to reconnect if not intentionally closed
        if (reconnectAttempts.current < maxReconnectAttempts) {
          console.info(`Attempting to reconnect (${reconnectAttempts.current + 1}/${maxReconnectAttempts})...`);
          reconnectAttempts.current += 1;
          setTimeout(connect, 1000 * Math.min(reconnectAttempts.current, 3));
        } else {
          toast({
            title: "Connection Lost",
            description: "Unable to reconnect to voice service. Please try again later.",
            variant: "destructive",
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (!isConnected) {
          toast({
            title: "Connection Error",
            description: "Failed to connect to voice service. Please check your internet connection.",
            variant: "destructive",
          });
        }
      };

      ws.onmessage = (event) => {
        console.info('Received message:', event.data);
        // Handle incoming messages here if needed
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize voice service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnect = () => {
    console.info('Disconnecting WebSocket...');
    if (wsRef.current) {
      reconnectAttempts.current = maxReconnectAttempts; // Prevent auto-reconnect
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  };

  const sendAudio = (audioData: Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioData);
    } else {
      console.warn('Cannot send audio: WebSocket is not connected');
      toast({
        title: "Connection Error",
        description: "Lost connection to voice service. Attempting to reconnect...",
        variant: "destructive",
      });
      connect(); // Attempt to reconnect
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    connect,
    disconnect,
    sendAudio,
    isConnected
  };
};