import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";

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
        return;
      }

      // Reset toast state
      toastShownRef.current = false;

      // Use the demo WebSocket URL with provided credentials
      const wsUrl = new URL('wss://api.vapi.ai/ws');
      wsUrl.searchParams.append('demo', 'true');
      wsUrl.searchParams.append('shareKey', '8b172799-931a-4e4e-be97-b2291b0b6434');
      wsUrl.searchParams.append('assistantId', '03c8458b-0abb-4d0a-98f6-456f99cb5000');
      
      wsRef.current = new WebSocket(wsUrl.toString());
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connection established');
        reconnectAttemptsRef.current = 0;

        // Send initial configuration
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "session.update",
            session: {
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_config: {
                sample_rate: 24000,
                channels: 1
              },
              output_audio_config: {
                sample_rate: 24000,
                channels: 1
              }
            }
          }));
        }
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast({
            title: "Connection Error",
            description: "Lost connection to the voice service. Please refresh the page.",
            variant: "destructive",
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

  return { wsRef };
};