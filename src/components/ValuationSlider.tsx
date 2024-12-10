import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ValuationSliderProps {
  isVisible: boolean;
  onValueChange?: (value: number[]) => void;
}

export const ValuationSlider = ({ isVisible, onValueChange }: ValuationSliderProps) => {
  const [value, setValue] = useState([500000]);
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (isVisible) {
      setAnimationClass("animate-in fade-in-0 slide-in-from-bottom-4");
    } else {
      setAnimationClass("animate-out fade-out-0 slide-out-to-bottom-4");
    }
  }, [isVisible]);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={cn(
      "fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl",
      "border border-white/20",
      animationClass,
      isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div className="mb-4 text-white/90">
        <h3 className="text-lg font-semibold mb-1">Estimated Annual Revenue</h3>
        <p className="text-2xl font-bold">{formatValue(value[0])}</p>
      </div>
      
      <Slider
        defaultValue={[500000]}
        max={10000000}
        min={100000}
        step={50000}
        value={value}
        onValueChange={(newValue) => {
          setValue(newValue);
          onValueChange?.(newValue);
        }}
        className="my-4"
      />
      
      <div className="flex justify-between text-sm text-white/60">
        <span>$100K</span>
        <span>$10M</span>
      </div>
    </div>
  );
};