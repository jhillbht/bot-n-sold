import { Button } from "@/components/ui/button";
import { Facebook, Linkedin, Mail } from "lucide-react";

export function SocialLogin() {
  const handleLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`);
    // Implement social login logic here
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm animate-fadeIn">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => handleLogin("facebook")}
      >
        <Facebook className="w-5 h-5" />
        Continue with Facebook
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => handleLogin("linkedin")}
      >
        <Linkedin className="w-5 h-5" />
        Continue with LinkedIn
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => handleLogin("google")}
      >
        <Mail className="w-5 h-5" />
        Continue with Google
      </Button>
    </div>
  );
}