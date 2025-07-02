import { MainLayout } from "@/components/layout/MainLayout";
import { StakePlinko } from "@/components/games/StakePlinko";
import { WinnersList } from "@/components/common/WinnersList";
import { CurrencySelector } from "@/components/common/CurrencySelector";
import { AdminRoute } from "@/components/guards/AdminRoute";
import { motion } from "framer-motion";

function PlinkoMasterPageContent() {
  return (
    <MainLayout>
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl lg:text-2xl font-bold font-heading">Plinko</h2>
            <CurrencySelector />
          </div>
          <StakePlinko />
        </motion.div>
      </div>
      
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">How to Play Plinko</h2>
          <div className="bg-background-light rounded-xl p-6">
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Set your bet amount using the controls on the left.</li>
              <li>Click the "DROP BALL" button to release the ball.</li>
              <li>Watch as the ball bounces through the pins and lands in a slot.</li>
              <li>Each slot has a different multiplier - higher multipliers are rarer!</li>
              <li>Your winnings are calculated by multiplying your bet by the slot multiplier.</li>
              <li>Click on any slot to see its probability percentage.</li>
            </ol>
            <div className="mt-4 p-4 bg-background-darker rounded-lg">
              <p className="text-sm text-accent-gold font-semibold">Strategy tip:</p>
              <p className="text-sm text-gray-400 mt-1">
                The ball has a higher chance of landing in center slots due to physics simulation.
                Edge slots with 2.0x multipliers are rare but offer the highest payouts!
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <WinnersList />
        </motion.div>
      </div>
    </MainLayout>
  );
}

export default function PlinkoMasterPage() {
  return (
    <AdminRoute>
      <PlinkoMasterPageContent />
    </AdminRoute>
  );
}