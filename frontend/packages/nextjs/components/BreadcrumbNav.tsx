import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function BreadcrumbNav({ currentPage, onNavigate }: BreadcrumbNavProps) {
  if (currentPage === "Home") return null;

  const pageNames: Record<string, string> = {
    Game: "Play Dice",
    History: "Game History",
    Docs: "Documentation",
  };

  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      <button
        onClick={() => onNavigate("Home")}
        className="flex items-center gap-1 text-[#a3a3a3] hover:text-[#fde047] transition-colors duration-200"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </button>
      <ChevronRight className="h-4 w-4 text-[#404040]" />
      <span className="text-[#fde047] font-medium">{pageNames[currentPage] || currentPage}</span>
    </nav>
  );
}
