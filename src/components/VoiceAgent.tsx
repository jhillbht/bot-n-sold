import { useState } from "react";
import { Mic, X, ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";

export const VoiceAgent = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const startCall = async () => {
    try {
      setIsProcessing(true);
      const { data, error } = await supabase.functions.invoke('start-call', {
        body: { assistantId: 'real-estate-agent' }
      });

      if (error) throw error;
      
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
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Mic className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <Mic className="h-12 w-12 text-gray-400" />
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