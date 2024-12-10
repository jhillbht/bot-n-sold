import { useState } from "react";
import { RoleCard } from "@/components/RoleCard";
import { SocialLogin } from "@/components/SocialLogin";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    toast({
      title: "Role selected",
      description: `You selected: ${role}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="text-4xl font-bold mb-4">Welcome to Business Exchange</h1>
          <p className="text-lg text-gray-600">Are you looking to buy or sell a business?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
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

        {selectedRole && (
          <div className="flex flex-col items-center gap-6 animate-fadeIn">
            <h2 className="text-2xl font-semibold">Continue with</h2>
            <SocialLogin />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;