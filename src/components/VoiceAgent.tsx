import { useState, useEffect, useRef } from "react";
import { useToast } from "./ui/use-toast";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { VoiceHeader } from "./VoiceHeader";
import { AudioQueue, encodeAudioData } from "@/utils/audioUtils";

export const VoiceAgent = () => {
  const [soundLevel, setSoundLevel] = useState(0);
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        audioQueueRef.current = new AudioQueue(audioContextRef.current);

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 32;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateSoundLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setSoundLevel(average / 128);
          requestAnimationFrame(updateSoundLevel);
        };
        updateSoundLevel();

        // Setup WebSocket connection to Vapi
        wsRef.current = new WebSocket(`wss://urdvklczigznduyzmgrf.functions.supabase.co/realtime-chat`);
        
        wsRef.current.onopen = () => {
          console.log('WebSocket connected');
          toast({
            title: "Welcome to Bot & Sold",
            description: "I'm your AI business advisor. How can I help you today? For example, I can assist with business valuations or guide you through selling your business.",
          });
        };

        wsRef.current.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);

          if (data.type === 'response.audio.delta') {
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            await audioQueueRef.current?.addToQueue(bytes);
          }
        };

        // Setup audio recorder
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const audioData = new Float32Array(reader.result as ArrayBuffer);
              const encodedAudio = encodeAudioData(audioData);
              wsRef.current?.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: encodedAudio
              }));
            };
            reader.readAsArrayBuffer(event.data);
          }
        };

        recorder.start(100); // Collect data every 100ms
      } catch (error) {
        console.error('Error setting up audio:', error);
        toast({
          title: "Error",
          description: "Could not access microphone. Please check your permissions.",
          variant: "destructive",
        });
      }
    };

    setupAudio();

    return () => {
      wsRef.current?.close();
      recorderRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <VoiceHeader />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <VoiceVisualizer soundLevel={soundLevel} />
      </div>
    </div>
  );
};