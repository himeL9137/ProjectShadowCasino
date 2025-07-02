import { MainLayout } from "@/components/layout/MainLayout";
import { PlinkoGame } from "@/components/games/PlinkoGame";
import { WinnersList } from "@/components/common/WinnersList";
import { motion } from "framer-motion";

export default function PlinkoPage() {
  return (
    <MainLayout>
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">Shadow Plinko</h2>
          <AdvancedPlinkoGame />
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
              <li>Click the "DROP BALL" button to start the game.</li>
              <li>Watch as the ball drops through the pins and lands in a bucket.</li>
              <li>Each bucket has a different multiplier - the one the ball lands in determines your win!</li>
              <li>Your winnings will be automatically added to your balance.</li>
            </ol>
            <div className="mt-4 p-4 bg-background-darker rounded-lg">
              <p className="text-sm text-accent-gold font-semibold">Pro tip:</p>
              <p className="text-sm text-gray-400">The center buckets typically have higher multipliers than the ones on the sides.</p>
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
