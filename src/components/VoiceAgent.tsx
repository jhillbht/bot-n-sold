import { useState } from "react";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { VoiceHeader } from "./VoiceHeader";
import { useVoiceWebSocket } from "@/hooks/useVoiceWebSocket";
import { useVoiceAudio } from "@/hooks/useVoiceAudio";
import { useSurveyState } from "@/hooks/useSurveyState";

export const VoiceAgent = () => {
  const [soundLevel, setSoundLevel] = useState(0);
  const { currentQuestion, questions, handleResponse } = useSurveyState();
  
  const wsRef = useVoiceWebSocket(async (data) => {
    console.log('Processing WebSocket message:', data);

    if (data.type === 'response.text') {
      const nextQuestion = await handleResponse(data.text.toLowerCase());
      if (nextQuestion && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'input_text',
          text: nextQuestion
        }));
      }
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
  });

  const { audioQueueRef } = useVoiceAudio(wsRef);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <VoiceHeader />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <VoiceVisualizer soundLevel={soundLevel} />
        <div className="mt-8 text-center">
          <p className="text-lg opacity-75">{questions[currentQuestion]}</p>
        </div>
      </div>
    </div>
  );
};