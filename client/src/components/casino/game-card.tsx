import { cn } from "@/lib/utils";
import type { Game } from "@shared/schema";

interface GameCardProps {
  game: Game;
  onClick: () => void;
  size?: "small" | "large";
  className?: string;
}

export default function GameCard({ game, onClick, size = "small", className }: GameCardProps) {
  const getShadowClass = () => {
    if (game.category === "live") return "hover:shadow-neon-purple";
    if (game.isHot) return "hover:shadow-neon-gold";
    return "hover:shadow-neon-green";
  };

  const getBadgeColor = () => {
    if (game.isLive) return "bg-casino-purple text-white";
    if (game.isHot) return "bg-casino-gold text-black";
    return "bg-casino-green text-black";
  };

  const getBadgeText = () => {
    if (game.isLive) return "LIVE";
    if (game.isHot) return "HOT";
    if (game.rtp) return `RTP ${game.rtp}%`;
    return "";
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-casino-gray rounded-lg overflow-hidden transition-all duration-300 transform hover:scale-105 cursor-pointer",
        getShadowClass(),
        size === "large" ? "rounded-xl" : "",
        className
      )}
    >
      <div className="relative">
        <img
          src={game.image}
          alt={game.name}
          className={cn(
            "w-full object-cover",
            size === "large" ? "h-40" : "h-32"
          )}
        />
        {getBadgeText() && (
          <span
            className={cn(
              "absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium",
              getBadgeColor()
            )}
          >
            {getBadgeText()}
          </span>
        )}
      </div>
      <div className={cn("p-3", size === "large" ? "p-6" : "")}>
        <div className="flex items-center justify-between mb-1">
          <h4 className={cn("font-semibold", size === "large" ? "text-base" : "text-sm")}>
            {game.name}
          </h4>
        </div>
        <p className="text-xs text-gray-400 mb-2">{game.provider}</p>
        {size === "large" && (
          <>
            <p className="text-gray-400 text-sm mb-4">
              {game.category === "slots" && "Progressive jackpot slot with massive wins"}
              {game.category === "live" && "High stakes with real dealers"}
              {game.category === "table" && "Classic casino experience"}
            </p>
            <button
              className={cn(
                "w-full font-semibold py-2 rounded-lg transition-all",
                game.category === "live"
                  ? "bg-gradient-to-r from-casino-purple to-purple-400 text-white hover:shadow-neon-purple"
                  : game.isHot
                  ? "bg-gradient-to-r from-casino-gold to-yellow-400 text-black hover:shadow-neon-gold"
                  : "bg-gradient-to-r from-casino-green to-green-400 text-black hover:shadow-neon-green"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {game.category === "live" ? "Join Table" : game.category === "table" ? "Play Now" : "Spin Now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
