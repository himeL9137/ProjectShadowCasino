import { useToast as useOriginalToast } from "./use-toast";
import { useTranslation } from '@/providers/LanguageProvider';

// Create a fixed version of useToast that works better with our game components
export function useToastFixed() {
  const originalToast = useOriginalToast();
  const { t } = useTranslation();
  
  return {
    ...originalToast,
    success: (message: string) => {
      originalToast.toast({
        title: t('ui.success'),
        description: message,
        variant: "default"
      });
    },
    error: (message: string) => {
      originalToast.toast({
        title: t('ui.error'),
        description: message,
        variant: "destructive"
      });
    },
    info: (message: string) => {
      originalToast.toast({
        title: t('ui.info'),
        description: message,
        variant: "default"
      });
    },
    warning: (message: string) => {
      originalToast.toast({
        title: t('ui.warning'),
        description: message,
        variant: "destructive"
      });
    }
  };
}