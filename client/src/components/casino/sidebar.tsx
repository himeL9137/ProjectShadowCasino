import { cn } from "@/lib/utils";
import { Home, Gem, Spade, Video, Gamepad2 } from "lucide-react";

interface CasinoSidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: "all", label: "All Games", icon: Home },
  { id: "slots", label: "Slots", icon: Gem },
  { id: "table", label: "Table Games", icon: Spade },
  { id: "live", label: "Live Casino", icon: Video },
  { id: "originals", label: "Originals", icon: Gamepad2 },
];

const providers = ["Pragmatic", "Evolution", "NetEnt", "Microgaming"];

export default function CasinoSidebar({ selectedCategory, onCategoryChange }: CasinoSidebarProps) {
  return (
    <aside className="w-64 bg-casino-darker border-r border-gray-800 h-screen">
      <div className="p-6">
        <div className="space-y-6">
          {/* Game Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Game Categories
            </h3>
            <nav className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className={cn(
                      "flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-all text-left",
                      selectedCategory === category.id
                        ? "text-casino-green bg-casino-green bg-opacity-10"
                        : "text-gray-400 hover:text-white hover:bg-casino-gray"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Providers */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Top Providers
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {providers.map((provider) => (
                <div
                  key={provider}
                  className="bg-casino-gray rounded-lg p-2 text-center text-xs hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  {provider}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
