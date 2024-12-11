import { useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const VAPI_API_KEY = "8b172799-931a-4e4e-be97-b2291b0b6434";

export const useVapiWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket('wss://api.vapi.ai/ws', [
          'vapi-protocol.v1',
          `vapi-api-key.${VAPI_API_KEY}`
        ]);
        
        wsRef.current.onopen = () => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "session.update",
              session: {
                assistant_id: "03c8458b-0abb-4d0a-98f6-456f99cb5000",
                input_audio_config: {
                  sample_rate: 24000,
                  channels: 1,
                  encoding: "pcm_f32le"
                },
                output_audio_config: {
                  sample_rate: 24000,
                  channels: 1,
                  encoding: "pcm_f32le"
                }
              }
            }));
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast({
            title: "Error",
            description: "Connection error. Please try again.",
            variant: "destructive",
          });
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket connection closed');
          setTimeout(connectWebSocket, 1000);
        };

      } catch (error) {
        console.error('Failed to connect:', error);
        toast({
          title: "Error",
          description: "Could not connect to voice service.",
          variant: "destructive",
        });
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [toast]);

  return wsRef;
};