import { useState, useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVoiceWebSocket } from "@/hooks/useVoiceWebSocket";

export const VoiceAgent = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [soundLevel, setSoundLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const { connect, disconnect, sendAudio } = useVoiceWebSocket();

  useEffect(() => {
    if (isRecording) {
      let audioContext: AudioContext;
      let analyser: AnalyserNode;
      let dataArray: Uint8Array;
      let animationFrame: number;

      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          audioContext = new AudioContext();
          analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 32;
          dataArray = new Uint8Array(analyser.frequencyBinCount);

          mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
          });

          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              sendAudio(event.data);
            }
          };

          mediaRecorderRef.current.start(100);

          const updateSoundLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setSoundLevel(average / 128);
            animationFrame = requestAnimationFrame(updateSoundLevel);
          };

          updateSoundLevel();
        } catch (error) {
          console.error('Error accessing microphone:', error);
          setIsRecording(false);
          toast({
            title: "Microphone Error",
            description: "Could not access your microphone. Please check permissions.",
            variant: "destructive",
          });
        }
      };

      connect();
      initAudio();

      return () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        if (audioContext) audioContext.close();
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
        }
        disconnect();
      };
    }
  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const orbScale = 1 + (soundLevel * 0.2);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <button
        onClick={toggleRecording}
        className="relative group"
        aria-label="Toggle voice recording"
      >
        <div 
          className={`absolute inset-0 rounded-full blur-xl transition-colors duration-300
            ${isRecording ? 'bg-blue-400/20' : 'bg-gray-200/50 group-hover:bg-gray-300/50'}`}
          style={{
            transform: isRecording ? `scale(${orbScale + 0.3})` : 'scale(1)',
            transition: 'transform 0.1s ease-out'
          }}
        />
        
        <div 
          className={`relative w-24 h-24 rounded-full transition-transform duration-300
            ${isRecording ? 'scale-110' : 'group-hover:scale-105'}`}
          style={{
            transform: isRecording ? `scale(${orbScale})` : undefined,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className={`absolute inset-0 rounded-full ${isRecording ? 'bg-blue-500/20' : 'bg-gray-100 group-hover:bg-gray-200'} transition-colors duration-300`} />
          <div className="absolute inset-0 rounded-full flex items-center justify-center">
            <Mic className={`h-8 w-8 ${isRecording ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-600'} transition-colors duration-300`} />
          </div>
        </div>
      </button>
    </div>
  );
};