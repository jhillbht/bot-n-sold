import { useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const VAPI_API_KEY = "vapi-ai-03c8458b0abb4d0a98f6456f99cb5000";

export const useVapiWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        console.log('Connecting to VAPI WebSocket...');
        wsRef.current = new WebSocket('wss://api.vapi.ai/ws', [
          'vapi-protocol.v1',
          `vapi-api-key.${VAPI_API_KEY}`
        ]);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connected successfully');
          
          // Send initial configuration
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

          toast({
            title: "Connected",
            description: "Voice chat is ready. Start speaking to interact.",
          });
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
          setTimeout(connectWebSocket, 1000); // Reconnect after 1 second
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
  }, []);

  return wsRef;
};