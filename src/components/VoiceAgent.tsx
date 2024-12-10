import { useState, useEffect, useRef } from "react";
import { Mic, X, ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useVoiceWebSocket } from "@/hooks/useVoiceWebSocket";

export const VoiceAgent = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundLevel, setSoundLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const { connect, disconnect, sendAudio, isConnected } = useVoiceWebSocket();

  useEffect(() => {
    if (isRecording) {
      let audioContext: AudioContext;
      let analyser: AnalyserNode;
      let dataArray: Uint8Array;
      let animationFrame: number;

      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Set up audio analysis
          audioContext = new AudioContext();
          analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 32;
          dataArray = new Uint8Array(analyser.frequencyBinCount);

          // Set up MediaRecorder for sending audio
          mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
          });

          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              sendAudio(event.data);
            }
          };

          mediaRecorderRef.current.start(100); // Collect data every 100ms

          const updateSoundLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setSoundLevel(average / 128); // Normalize to 0-1
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

  const startCall = async () => {
    try {
      setIsProcessing(true);
      setIsRecording(true);
      toast({
        title: "Call started",
        description: "You can start speaking now",
      });
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Could not start the call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const orbScale = 1 + (soundLevel * 0.2); // Scale between 1 and 1.2 based on sound level

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="flex justify-between items-center mb-8">
        <Button variant="ghost" size="icon" className="text-white">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-medium">Speaking to AI bot</h1>
        <Button variant="ghost" size="icon" className="text-white">
          <MoreVertical className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        {isRecording ? (
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-full blur-xl bg-blue-400/20"
              style={{
                transform: `scale(${orbScale + 0.3})`,
                transition: 'transform 0.1s ease-out'
              }}
            />
            
            <div className="animate-[float_6s_ease-in-out_infinite]">
              <div 
                className="relative w-32 h-32"
                style={{
                  transform: `scale(${orbScale})`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-600/30 backdrop-blur-sm" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-700/40" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-400/50 to-purple-600/50" />
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-300/60 to-purple-500/60 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-[spin_4s_linear_infinite]" />
                  <div className="absolute inset-2 rounded-full border border-white/10 animate-[spin_3s_linear_infinite]" />
                  <Mic className="h-8 w-8 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="relative w-32 h-32 cursor-pointer group" onClick={startCall}>
              <div className="absolute inset-0 rounded-full blur-md bg-blue-400/10 group-hover:bg-blue-400/20 transition-colors" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 group-hover:from-blue-400/30 group-hover:to-purple-600/30 transition-colors" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-700/30 flex items-center justify-center">
                <Mic className="h-8 w-8 text-white/60 group-hover:text-white/80 transition-colors" />
              </div>
            </div>
            
            <Button
              onClick={startCall}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-lg"
            >
              {isProcessing ? "Starting..." : "Start Recording"}
            </Button>
          </div>
        )}
      </div>

      {isRecording && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <Button
            onClick={() => setIsRecording(false)}
            variant="ghost"
            size="icon"
            className="bg-gray-800/50 hover:bg-gray-700/50 rounded-full h-14 w-14"
          >
            <X className="h-8 w-8 text-white" />
          </Button>
        </div>
      )}
    </div>
  );
};