import { MainLayout } from "@/components/layout/MainLayout";
import { SlotsGame } from "@/components/games/SlotsGame";
import { WinnersList } from "@/components/common/WinnersList";
import { CurrencySelector } from "@/components/common/CurrencySelector";
import { motion } from "framer-motion";

export default function SlotsPage() {
  return (
    <MainLayout>
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl lg:text-2xl font-bold font-heading">Shadow Slots</h2>
            <CurrencySelector />
          </div>
          <SlotsGame />
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
              <li>Enter your bet amount in the input field.</li>
              <li>Click the "SPIN" button to start the game.</li>
              <li>If three or more matching symbols appear, you win!</li>
              <li>Your winnings will be automatically added to your balance.</li>
            </ol>
            <div className="mt-4 p-4 bg-background-darker rounded-lg">
              <p className="text-sm text-accent-gold font-semibold">Pro tip:</p>
              <p className="text-sm text-gray-400">Use the 1/2 and 2x buttons to quickly adjust your bet amount.</p>
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
