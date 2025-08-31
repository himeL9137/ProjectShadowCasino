import { MainLayout } from "@/components/layout/MainLayout";
import { MinesGame } from "@/components/games/MinesGame";
import { WinnersList } from "@/components/common/WinnersList";
import { motion } from "framer-motion";
import { useTranslation } from '@/providers/LanguageProvider';

export default function MinesPage() {
  const { t } = useTranslation();
  
  return (
    <MainLayout>
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">Shadow Mines</h2>
          <MinesGame />
        </motion.div>
      </div>
      
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">How to Play</h2>
          <div className="bg-background-light rounded-xl p-6">
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Set your bet amount and choose the number of mines (1-24)</li>
              <li>Click "Start Game" to begin</li>
              <li>Click tiles to reveal gems while avoiding mines</li>
              <li>Each gem found increases your multiplier and potential win</li>
              <li>Cash out anytime to secure your winnings, or hit a mine and lose everything</li>
            </ol>
            <div className="mt-4 p-4 bg-background-darker rounded-lg">
              <p className="text-sm text-accent-gold font-semibold">Pro Tip</p>
              <p className="text-sm text-gray-400">More mines = higher multipliers but greater risk. Start with fewer mines to learn the game!</p>
            </div>
          </div>
        </motion.div>
      </div>
      
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">Recent Winners</h2>
          <WinnersList />
        </motion.div>
      </div>
    </MainLayout>
  );
}