import { useEffect, useState } from "react";
import { Mic } from "lucide-react";

interface VoiceVisualizerProps {
  soundLevel: number;
}

export const VoiceVisualizer = ({ soundLevel }: VoiceVisualizerProps) => {
  const [orbScale, setOrbScale] = useState(1);

  useEffect(() => {
    setOrbScale(1 + (soundLevel * 0.2));
  }, [soundLevel]);

  return (
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
  );
};