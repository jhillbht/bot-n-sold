import { useState } from "react";
import { RoleCard } from "@/components/RoleCard";
import { SocialLogin } from "@/components/SocialLogin";
import { VoiceAgent } from "@/components/VoiceAgent";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showVoiceAgent, setShowVoiceAgent] = useState(false);
  const { toast } = useToast();

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
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12 animate-fadeIn">
              <h1 className="text-4xl font-bold mb-4">Welcome to Business Exchange</h1>
              <p className="text-lg text-gray-600">Are you looking to buy or sell a business?</p>
            </div>

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

            {selectedRole && (
              <div className="flex flex-col items-center gap-6 mt-12 animate-fadeIn">
                <h2 className="text-2xl font-semibold">Continue with</h2>
                <SocialLogin />
                <Button
                  onClick={() => setShowVoiceAgent(true)}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white"
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