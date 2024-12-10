import { useRef, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AudioQueue } from '@/utils/audioUtils';

export const useAudioSetup = (onAudioData: (data: Blob) => void) => {
  const [soundLevel, setSoundLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

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

        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            onAudioData(event.data);
          }
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
      recorderRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, [onAudioData]);

  return {
    soundLevel,
    audioQueue: audioQueueRef.current,
  };
};