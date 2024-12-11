import { useRef } from "react";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { VoiceHeader } from "./VoiceHeader";
import { encodeAudioData } from "@/utils/audioUtils";
import { useVapiWebSocket } from "@/hooks/useVapiWebSocket";
import { useAudioSetup } from "@/hooks/useAudioSetup";
import { useToast } from "@/components/ui/use-toast";

export const VoiceAgent = () => {
  const wsRef = useVapiWebSocket();
  const { toast } = useToast();

  const handleAudioData = (data: Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const audioData = new Float32Array(reader.result as ArrayBuffer);
        const encodedAudio = encodeAudioData(audioData);
        wsRef.current?.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: encodedAudio
        }));
      };
      reader.readAsArrayBuffer(data);
    }
  };

  const { soundLevel, audioQueue } = useAudioSetup(handleAudioData);

  // Set up WebSocket message handler
  if (wsRef.current) {
    wsRef.current.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        if (data.type === 'response.audio.delta') {
          const binaryString = atob(data.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await audioQueue?.addToQueue(bytes);
        } else if (data.type === 'error') {
          console.error('VAPI error:', data);
          toast({
            title: "Error",
            description: "There was an error processing your request.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <VoiceHeader />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <VoiceVisualizer soundLevel={soundLevel} />
      </div>
    </div>
  );
};