import { MainLayout } from "@/components/layout/MainLayout";
import { DiceGame } from "@/components/games/DiceGame";
import { WinnersList } from "@/components/common/WinnersList";
import { motion } from "framer-motion";

export default function DicePage() {
  return (
    <MainLayout>
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">Shadow Dice</h2>
          <DiceGame />
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
              <li>Click the "ROLL DICE" button to start the game.</li>
              <li>Get 3 matching dice in the middle positions to win!</li>
              <li>Your winnings will be automatically added to your balance.</li>
            </ol>
            <div className="mt-4 p-4 bg-background-darker rounded-lg">
              <p className="text-sm text-accent-gold font-semibold">Pro tip:</p>
              <p className="text-sm text-gray-400">Higher dice values give better multipliers when you win!</p>
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
