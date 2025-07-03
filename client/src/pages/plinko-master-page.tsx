import { MainLayout } from "@/components/layout/MainLayout";
import { StakePlinko } from "@/components/games/StakePlinko";
import { WinnersList } from "@/components/common/WinnersList";
import { CurrencySelector } from "@/components/common/CurrencySelector";
import { AdminRoute } from "@/components/guards/AdminRoute";
import { motion } from "framer-motion";
import { useTranslation } from '@/providers/LanguageProvider';

function PlinkoMasterPageContent() {
  const { t } = useTranslation();
  
  return (
    <MainLayout>
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl lg:text-2xl font-bold font-heading">{t('nav.plinko')}</h2>
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
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">{t('plinko.howToPlay')}</h2>
          <div className="bg-background-light rounded-xl p-6">
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>{t('plinko.instruction1')}</li>
              <li>{t('plinko.instruction2')}</li>
              <li>{t('plinko.instruction3')}</li>
              <li>{t('plinko.instruction4')}</li>
              <li>{t('plinko.instruction5')}</li>
              <li>{t('plinko.instruction6')}</li>
            </ol>
            <div className="mt-4 p-4 bg-background-darker rounded-lg">
              <p className="text-sm text-accent-gold font-semibold">{t('plinko.strategyTip')}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t('plinko.strategyText')}
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