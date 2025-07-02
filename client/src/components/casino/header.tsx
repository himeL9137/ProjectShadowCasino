import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Diamond, Coins, User } from "lucide-react";

export default function CasinoHeader() {
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  return (
    <header className="bg-casino-darker border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-casino-green to-casino-purple rounded-lg flex items-center justify-center">
              <Diamond className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-casino-green to-casino-purple bg-clip-text text-transparent">
              StakeClone
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-casino-green font-medium">Casino</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Sports</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Originals</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Promotions</a>
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {/* Virtual Balance */}
            <div className="bg-casino-gray rounded-lg px-4 py-2 flex items-center space-x-2">
              <Coins className="h-4 w-4 text-casino-gold" />
              <span className="font-semibold">
                ${user?.balance ? parseFloat(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '10,000.00'}
              </span>
            </div>
            <Button className="bg-casino-green hover:bg-casino-green/90 text-black font-semibold shadow-neon-green">
              Deposit
            </Button>
            <Button
              size="icon"
              className="bg-casino-purple hover:bg-casino-purple/90 rounded-full shadow-neon-purple"
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
