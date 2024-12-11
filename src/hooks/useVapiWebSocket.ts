import { useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useVapiWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create WebSocket connection
    wsRef.current = new WebSocket(`wss://urdvklczigznduyzmgrf.functions.supabase.co/realtime-chat`);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      toast({
        title: "Connected",
        description: "Voice chat is ready. Start speaking to interact.",
      });

      // Send initial configuration
      wsRef.current?.send(JSON.stringify({
        type: "session.update",
        session: {
          assistant_id: "03c8458b-0abb-4d0a-98f6-456f99cb5000",
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_config: {
            sample_rate: 24000,
            channels: 1
          },
          output_audio_config: {
            sample_rate: 24000,
            channels: 1
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          }
        }
      }));
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to voice chat. Please try again.",
        variant: "destructive",
      });
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  return wsRef;
};