import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  title: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
}

export function RoleCard({ title, description, selected, onClick }: RoleCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1",
        selected && "border-primary border-2",
        "animate-fadeIn"
      )}
      onClick={onClick}
    >
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold mb-2">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}