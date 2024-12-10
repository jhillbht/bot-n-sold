import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useVoiceWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const connect = () => {
    console.info('Initializing WebSocket...');
    
    const ws = new WebSocket(
      'wss://api.vapi.ai/ws?demo=true&shareKey=8b172799-931a-4e4e-be97-b2291b0b6434&assistantId=03c8458b-0abb-4d0a-98f6-456f99cb5000'
    );

    ws.onopen = () => {
      console.info('WebSocket connected');
      setIsConnected(true);
      
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

    ws.onclose = () => {
      console.info('WebSocket closed');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to voice service. Please try again.",
        variant: "destructive",
      });
    };

    wsRef.current = ws;
  };

  const disconnect = () => {
    console.info('Cleaning up WebSocket...');
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendAudio = (audioData: Blob) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(audioData);
    }
  };

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