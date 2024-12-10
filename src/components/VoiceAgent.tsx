import { useState } from "react";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { VoiceHeader } from "./VoiceHeader";
import { useVoiceWebSocket } from "@/hooks/useVoiceWebSocket";
import { useVoiceAudio } from "@/hooks/useVoiceAudio";

export const VoiceAgent = () => {
  const [soundLevel, setSoundLevel] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("Hi! I'm your AI business advisor. How can I help you today?");
  
  const wsRef = useVoiceWebSocket(async (data) => {
    console.log('Processing WebSocket message:', data);

    if (data.type === 'response.text') {
      setCurrentMessage(data.text);
    }

    if (data.type === 'response.audio.delta') {
      console.log('Processing audio response');
      const binaryString = atob(data.delta);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      await audioQueueRef.current?.addToQueue(bytes);
    }

    if (data.type === 'speech.partialTranscript') {
      setSoundLevel(0.5); // Simulate sound level when user is speaking
    } else {
      setSoundLevel(0);
    }
  });

  const { audioQueueRef } = useVoiceAudio(wsRef);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <VoiceHeader />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <VoiceVisualizer soundLevel={soundLevel} />
        <div className="mt-8 text-center max-w-xl mx-auto">
          <p className="text-lg opacity-75">{currentMessage}</p>
        </div>
      </div>
    </div>
  );
};