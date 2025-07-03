import { MainLayout } from "@/components/layout/MainLayout";
import { DiceGame } from "@/components/games/DiceGame";
import { WinnersList } from "@/components/common/WinnersList";
import { motion } from "framer-motion";
import { useTranslation } from '@/providers/LanguageProvider';

export default function DicePage() {
  const { t } = useTranslation();
  
  return (
    <MainLayout>
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">{t('dice.shadowDice')}</h2>
          <DiceGame />
        </motion.div>
      </div>
      
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">{t('dice.howToPlay')}</h2>
          <div className="bg-background-light rounded-xl p-6">
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>{t('dice.instruction1')}</li>
              <li>{t('dice.instruction2')}</li>
              <li>{t('dice.instruction3')}</li>
              <li>{t('dice.instruction4')}</li>
            </ol>
            <div className="mt-4 p-4 bg-background-darker rounded-lg">
              <p className="text-sm text-accent-gold font-semibold">{t('dice.proTip')}</p>
              <p className="text-sm text-gray-400">{t('dice.proTipText')}</p>
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
