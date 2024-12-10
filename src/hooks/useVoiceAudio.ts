import { useRef, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { AudioQueue, encodeAudioData } from "@/utils/audioUtils";

export const useVoiceAudio = (wsRef: React.RefObject<WebSocket>) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const setupAudio = async () => {
      try {
        console.log('Setting up audio...');
        
        // Clean up existing resources first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
          await audioContextRef.current.close();
        }
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }

        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 24000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        streamRef.current = stream;
        console.log('Audio stream obtained:', stream.getAudioTracks()[0].label);

        // Create new audio context
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        audioQueueRef.current = new AudioQueue(audioContextRef.current);

        // Create new recorder
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
        console.log('MediaRecorder started');
      } catch (error) {
        console.error('Error setting up audio:', error);
        toast({
          title: "Microphone Access Error",
          description: "Could not access microphone. Please check your permissions and try again.",
          variant: "destructive",
        });
      }
    };

    // Call setupAudio immediately
    setupAudio();

    // Cleanup function
    return () => {
      console.log('Cleaning up audio resources...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('Stopping track:', track.label);
          track.stop();
        });
      }
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [wsRef, toast]);

  return { audioQueueRef };
};