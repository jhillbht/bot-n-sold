import { ArrowLeft, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";

export const VoiceHeader = () => (
  <div className="flex justify-between items-center mb-8">
    <Button variant="ghost" size="icon" className="text-white">
      <ArrowLeft className="h-6 w-6" />
    </Button>
    <h1 className="text-lg font-medium">Business Advisor AI</h1>
    <Button variant="ghost" size="icon" className="text-white">
      <MoreVertical className="h-6 w-6" />
    </Button>
  </div>
);