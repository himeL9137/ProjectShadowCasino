import { useState } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '@/lib/i18n';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'default' | 'auth' | 'compact';
  showFlag?: boolean;
  showNativeName?: boolean;
}

export function LanguageSelector({ 
  className = '', 
  variant = 'default',
  showFlag = true,
  showNativeName = true 
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = getLanguageByCode(language);

  const handleLanguageChange = (langCode: string) => {
    console.log('Language selector: changing from', language, 'to', langCode);
    setLanguage(langCode);
    setIsOpen(false);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'auth':
        return {
          trigger: 'bg-black/20 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm',
          dropdown: 'bg-black/90 border-white/20 backdrop-blur-md',
          item: 'text-white hover:bg-white/10'
        };
      case 'compact':
        return {
          trigger: 'bg-background border-border text-foreground hover:bg-accent px-2 py-1 text-sm',
          dropdown: 'bg-background border-border',
          item: 'text-foreground hover:bg-accent'
        };
      default:
        return {
          trigger: 'bg-background border-border text-foreground hover:bg-accent',
          dropdown: 'bg-background border-border',
          item: 'text-foreground hover:bg-accent'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between px-3 py-2 rounded-lg border transition-colors
          min-w-[140px] ${styles.trigger}
        `}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <div className="flex items-center space-x-1">
            {showFlag && currentLanguage && (
              <span className="text-sm">{currentLanguage.flag}</span>
            )}
            <span className="text-sm font-medium">
              {showNativeName && currentLanguage 
                ? currentLanguage.nativeName 
                : currentLanguage?.name || 'English'
              }
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className={`
            absolute top-full left-0 mt-1 w-full min-w-[240px] max-h-64 overflow-y-auto
            border rounded-lg shadow-lg z-20 ${styles.dropdown}
          `}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`
                  w-full px-3 py-2 text-left flex items-center justify-between
                  transition-colors ${styles.item}
                  ${language === lang.code ? 'font-medium' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  {showFlag && (
                    <span className="text-base">{lang.flag}</span>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{lang.name}</span>
                    {showNativeName && lang.nativeName !== lang.name && (
                      <span className="text-xs opacity-70">{lang.nativeName}</span>
                    )}
                  </div>
                </div>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for navigation bars
export function CompactLanguageSelector({ className = '' }: { className?: string }) {
  return (
    <LanguageSelector 
      className={className}
      variant="compact"
      showFlag={true}
      showNativeName={false}
    />
  );
}

// Auth page specific version
export function AuthLanguageSelector({ className = '' }: { className?: string }) {
  return (
    <LanguageSelector 
      className={className}
      variant="auth"
      showFlag={true}
      showNativeName={true}
    />
  );
}