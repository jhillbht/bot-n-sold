import { useState, useEffect, useRef } from "react";
import { useToast } from "./ui/use-toast";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { VoiceHeader } from "./VoiceHeader";
import { ValuationSlider } from "./ValuationSlider";
import { AudioQueue, encodeAudioData } from "@/utils/audioUtils";
import { supabase } from "@/integrations/supabase/client";

export const VoiceAgent = () => {
  const [soundLevel, setSoundLevel] = useState(0);
  const [showValuationSlider, setShowValuationSlider] = useState(false);
  const [surveyData, setSurveyData] = useState({
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    businessType: "",
    email: "",
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const questions = [
    "What's your monthly revenue?",
    "What's your monthly expenses?",
    "What type of business do you have?",
    "Where should I send an email of your valuation?",
  ];

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

        // Initialize WebSocket with error handling
        const initWebSocket = () => {
          console.log('Initializing WebSocket...');
          wsRef.current = new WebSocket(`wss://urdvklczigznduyzmgrf.functions.supabase.co/realtime-chat`);
          
          wsRef.current.onopen = () => {
            console.log('WebSocket connected');
            // Start the conversation
            wsRef.current?.send(JSON.stringify({
              type: 'input_text',
              text: "Hello! I'm here to help you with your business valuation. How can I assist you today?"
            }));
          };

          wsRef.current.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);

            if (data.type === 'response.text') {
              const text = data.text.toLowerCase();
              console.log('Processing text response:', text);
              
              // Process responses based on current question
              if (currentQuestion === 0 && text.includes('revenue')) {
                const match = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
                if (match) {
                  const revenue = parseFloat(match[1].replace(/,/g, ''));
                  setSurveyData(prev => ({ ...prev, monthlyRevenue: revenue }));
                  setCurrentQuestion(1);
                  wsRef.current?.send(JSON.stringify({
                    type: 'input_text',
                    text: questions[1]
                  }));
                }
              } else if (currentQuestion === 1 && text.includes('expenses')) {
                const match = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
                if (match) {
                  const expenses = parseFloat(match[1].replace(/,/g, ''));
                  setSurveyData(prev => ({ ...prev, monthlyExpenses: expenses }));
                  setCurrentQuestion(2);
                  wsRef.current?.send(JSON.stringify({
                    type: 'input_text',
                    text: questions[2]
                  }));
                }
              } else if (currentQuestion === 2) {
                setSurveyData(prev => ({ ...prev, businessType: text }));
                setCurrentQuestion(3);
                wsRef.current?.send(JSON.stringify({
                  type: 'input_text',
                  text: questions[3]
                }));
              } else if (currentQuestion === 3 && text.includes('@')) {
                const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                if (emailMatch) {
                  const email = emailMatch[0];
                  setSurveyData(prev => ({ ...prev, email: email }));
                  
                  // Send valuation email
                  const response = await fetch('https://urdvklczigznduyzmgrf.functions.supabase.co/send-valuation-email', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...surveyData, email }),
                  });

                  if (response.ok) {
                    wsRef.current?.send(JSON.stringify({
                      type: 'input_text',
                      text: `Great! I've sent your valuation report to ${email}. Is there anything else you'd like to know?`
                    }));
                    toast({
                      title: "Valuation Report Sent",
                      description: `Check your email at ${email} for your business valuation report.`,
                    });
                  } else {
                    toast({
                      title: "Error",
                      description: "Failed to send valuation report. Please try again.",
                      variant: "destructive",
                    });
                  }
                }
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
          };

          wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            toast({
              title: "Connection Error",
              description: "Lost connection to the voice service. Please refresh the page.",
              variant: "destructive",
            });
          };

          wsRef.current.onclose = () => {
            console.log('WebSocket closed, attempting to reconnect...');
            setTimeout(initWebSocket, 3000); // Attempt to reconnect after 3 seconds
          };
        };

        initWebSocket();

        // Set up MediaRecorder with error handling
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
      console.log('Cleaning up voice agent...');
      wsRef.current?.close();
      recorderRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, [currentQuestion]);

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