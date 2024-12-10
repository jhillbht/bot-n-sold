import { useState, useEffect } from "react";
import { RoleCard } from "@/components/RoleCard";
import { SocialLogin } from "@/components/SocialLogin";
import { VoiceAgent } from "@/components/VoiceAgent";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Show content after 10 seconds
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 10000);

    // Add exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShowContent(true);
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    toast({
      title: "Role selected",
      description: `You selected: ${role}`,
    });
  };

  return (
    <>
      {showVoiceAgent ? (
        <VoiceAgent />
      ) : (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12 animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4 text-white">Welcome to Business Exchange</h1>
              <p className="text-lg text-gray-300">Are you looking to buy or sell a business?</p>
            </div>

            {!showContent ? (
              <div className="flex justify-center items-center mt-20">
                <Button
                  onClick={() => setShowVoiceAgent(true)}
                  className="bg-transparent hover:bg-transparent p-0"
                >
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 flex items-center justify-center">
                      <span className="text-white opacity-80">Speak to AI</span>
                    </div>
                  </div>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
                  <RoleCard
                    title="Buyer"
                    description="Find the perfect business opportunity"
                    selected={selectedRole === "buyer"}
                    onClick={() => handleRoleSelect("buyer")}
                  />
                  <RoleCard
                    title="Seller"
                    description="Connect with qualified buyers"
                    selected={selectedRole === "seller"}
                    onClick={() => handleRoleSelect("seller")}
                  />
                </div>
                
                <div className="max-w-md w-full">
                  <RoleCard
                    title="Broker"
                    description="Facilitate business transactions"
                    selected={selectedRole === "broker"}
                    onClick={() => handleRoleSelect("broker")}
                  />
                </div>
              </div>
            )}

            {selectedRole && showContent && (
              <div className="flex flex-col items-center gap-6 mt-12 animate-fadeIn">
                <h2 className="text-2xl font-semibold text-white">Continue with</h2>
                <SocialLogin />
                <Button
                  onClick={() => setShowVoiceAgent(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Talk to AI Assistant
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Index;