import { useState, useEffect, useRef } from "react";
import { Mic, X, ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.buffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }
}

export const VoiceAgent = () => {
  const [isRecording, setIsRecording] = useState(true);
  const [soundLevel, setSoundLevel] = useState(0);
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const encodeAudioData = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  };

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

        // Setup WebSocket connection
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
        setIsRecording(false);
      }
    };

    setupAudio();

    return () => {
      wsRef.current?.close();
      recorderRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  const orbScale = 1 + (soundLevel * 0.2);

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