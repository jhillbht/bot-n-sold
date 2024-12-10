import { useRef, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { AudioQueue, encodeAudioData } from "@/utils/audioUtils";

export const useVoiceAudio = (wsRef: React.RefObject<WebSocket>) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const setupAudio = async () => {
      try {
        console.log('Setting up audio...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('Audio stream obtained');

        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        audioQueueRef.current = new AudioQueue(audioContextRef.current);

        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('Sending audio data...');
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

        recorder.onerror = (error) => {
          console.error('MediaRecorder error:', error);
          toast({
            title: "Recording Error",
            description: "There was an error with the microphone. Please refresh the page.",
            variant: "destructive",
          });
        };

        recorder.start(100);
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
      console.log('Cleaning up audio...');
      recorderRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, [wsRef, toast]);

  return { audioQueueRef };
};