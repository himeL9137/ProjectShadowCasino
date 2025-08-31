import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GameType } from "@shared/schema";

interface GameCardProps {
  type: GameType;
  title: string;
  description: string;
  backgroundClass: string;
  icon: React.ReactNode;
}

export function GameCard({ type, title, description, backgroundClass, icon }: GameCardProps) {
  const path = `/${type.toLowerCase()}`;

  return (
    <motion.div 
      className="bg-background-light rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`h-48 ${backgroundClass} relative overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          {icon}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold font-heading mb-1">{title}</h3>
        <p className="text-gray-400 text-sm mb-3">{description}</p>
        
        <div className="flex space-x-2">
          <Link href={path}>
            <Button className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded-lg transition-colors">
              Play Now
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Predefined game cards for easy use
export function SlotsCard() {
  return (
    <GameCard
      type={GameType.SLOTS}
      title="Shadow Slots"
      description="Spin to win up to 150x your bet!"
      backgroundClass="bg-gradient-to-br from-secondary to-primary"
      icon={
        <div className="grid grid-cols-3 gap-2 p-4">
          <div className="bg-background-darker rounded-lg p-2 flex items-center justify-center text-accent-gold text-2xl">
            🍒
          </div>
          <div className="bg-background-darker rounded-lg p-2 flex items-center justify-center text-accent-gold text-2xl">
            🎰
          </div>
          <div className="bg-background-darker rounded-lg p-2 flex items-center justify-center text-accent-gold text-2xl">
            💎
          </div>
        </div>
      }
    />
  );
}

export function DiceCard() {
  return (
    <GameCard
      type={GameType.DICE}
      title="Shadow Dice"
      description="Roll above the target number to win!"
      backgroundClass="bg-gradient-to-br from-emerald-600 to-teal-800"
      icon={
        <div className="relative w-20 h-20 flex items-center justify-center bg-white rounded-lg shadow-lg">
          <div className="grid grid-cols-3 grid-rows-3 gap-1">
            <span className="w-2 h-2 rounded-full bg-background-darker"></span>
            <span className="w-2 h-2 rounded-full bg-background-darker"></span>
            <span className="w-2 h-2 rounded-full bg-background-darker"></span>
            <span className="w-2 h-2 rounded-full bg-background-darker"></span>
            <span className="w-2 h-2 rounded-full bg-background-darker"></span>
            <span className="w-2 h-2 rounded-full bg-background-darker"></span>
          </div>
        </div>
      }
    />
  );
}

export function PlinkoCard() {
  return (
    <GameCard
      type={GameType.PLINKO}
      title="Shadow Plinko"
      description="Watch the ball drop and multiply your bet!"
      backgroundClass="bg-gradient-to-br from-rose-500 to-pink-700"
      icon={
        <div className="relative w-32 h-32">
          <div className="grid grid-cols-5 gap-3">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-white"></div>
            ))}
          </div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-400 shadow-lg"></div>
        </div>
      }
    />
  );
}

export function MinesCard() {
  return (
    <GameCard
      type={GameType.MINES}
      title="Shadow Mines"
      description="Find gems while avoiding mines in this 5x5 grid!"
      backgroundClass="bg-gradient-to-br from-orange-600 to-red-800"
      icon={
        <div className="relative w-32 h-32">
          <div className="grid grid-cols-5 gap-1">
            {[...Array(25)].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded bg-neutral-700 border border-neutral-600 flex items-center justify-center">
                {i === 7 && <span className="text-red-400 text-xs">💣</span>}
                {i === 12 && <span className="text-green-400 text-xs">💎</span>}
                {i === 18 && <span className="text-green-400 text-xs">💎</span>}
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}

export function PlinkoMasterCard() {
  return (
    <GameCard
      type={GameType.PLINKO_MASTER}
      title="Plinko"
      description="Advanced plinko with dynamic physics and 16 slots!"
      backgroundClass="bg-gradient-to-br from-purple-600 to-indigo-800"
      icon={
        <div className="relative w-40 h-32 flex flex-col items-center">
          {/* Pin rows */}
          {[0, 1, 2, 3, 4].map(row => (
            <div key={row} className="flex justify-center mb-1" style={{ paddingLeft: `${(row % 2) * 8}px` }}>
              {Array.from({ length: Math.min(8 - Math.floor(row / 2), 6) }).map((_, pin) => (
                <div
                  key={pin}
                  className="w-1.5 h-1.5 bg-white rounded-full mx-1 opacity-70"
                />
              ))}
            </div>
          ))}
          {/* Ball */}
          <div className="w-3 h-3 bg-orange-400 rounded-full shadow-lg mb-2"></div>
          {/* Slots */}
          <div className="flex justify-center space-x-px">
            {[2.0, 1.8, 1.6, 1.4, 1.0, 0.8, 0.6, 0.4].map((multiplier, i) => (
              <div
                key={i}
                className={`px-1 py-0.5 text-xs rounded ${
                  multiplier >= 1.5 ? 'bg-red-500' :
                  multiplier >= 1.0 ? 'bg-green-500' :
                  'bg-gray-500'
                }`}
              >
                {multiplier}x
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
