import { useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useVapiWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    const connectWebSocket = async () => {
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice chat. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Get the API key from our Edge Function
        const response = await fetch('https://urdvklczigznduyzmgrf.functions.supabase.co/get-vapi-key');
        if (!response.ok) {
          throw new Error('Failed to get API key');
        }
        const { apiKey } = await response.json();

        if (wsRef.current) {
          wsRef.current.close();
        }

        console.log('Connecting to VAPI WebSocket...');
        wsRef.current = new WebSocket('wss://api.vapi.ai/ws', [
          'vapi-protocol.v1',
          `vapi-api-key.${apiKey}`
        ]);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connected successfully');
          reconnectAttemptsRef.current = 0;
          
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
          reconnectAttemptsRef.current++;
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket connection closed');
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        };
      } catch (error) {
        console.error('Failed to connect:', error);
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
      }
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