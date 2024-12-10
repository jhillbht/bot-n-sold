import { useState, useEffect } from "react";
import { Mic, X, ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";

export const VoiceAgent = () => {
  const [isRecording, setIsRecording] = useState(true); // Start recording by default
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundLevel, setSoundLevel] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    // Start the call automatically when component mounts
    startCall();
  }, []);

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
        }
      };

      initAudio();

      return () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        if (audioContext) audioContext.close();
      };
    }
  }, [isRecording]);

  const startCall = async () => {
    try {
      setIsProcessing(true);
      const { data, error } = await supabase.functions.invoke('start-call', {
        body: { assistantId: 'business-advisor' }
      });

      if (error) throw error;
      
      setIsRecording(true);
      toast({
        title: "Welcome to Bot & Sold",
        description: "I'm your AI business advisor. How can I help you today? For example, I can assist with business valuations or guide you through selling your business.",
      });
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Could not start the conversation. Please try again.",
        variant: "destructive",
      });
      setIsRecording(false);
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
        <h1 className="text-lg font-medium">Business Advisor AI</h1>
        <Button variant="ghost" size="icon" className="text-white">
          <MoreVertical className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
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