import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DollarSign, Check, AlertCircle, Info, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/hooks/use-currency";
import { Currency } from "@shared/schema";

const currencies = [
  {
    id: Currency.USD,
    name: "US Dollar",
    symbol: "$",
    code: "USD",
    description: "The official currency of the United States",
    icon: "🇺🇸",
  },
  {
    id: Currency.BDT,
    name: "Bangladeshi Taka",
    symbol: "৳",
    code: "BDT",
    description: "The official currency of Bangladesh",
    icon: "🇧🇩",
  },
  {
    id: Currency.INR,
    name: "Indian Rupee",
    symbol: "₹",
    code: "INR",
    description: "The official currency of India",
    icon: "🇮🇳",
  },
  {
    id: Currency.BTC,
    name: "Bitcoin",
    symbol: "₿",
    code: "BTC",
    description: "Digital cryptocurrency",
    icon: "🪙",
  },
  {
    id: Currency.JPY,
    name: "Japanese Yen",
    symbol: "¥",
    code: "JPY",
    description: "The official currency of Japan",
    icon: "🇯🇵",
  },
];

export default function CurrencyPage() {
  const { user } = useAuth();
  const { currency: currentCurrency, setCurrency, isChangingCurrency, getCurrencySymbol } = useCurrency();
  const { isConnected } = useWebSocket();
  const [error, setError] = useState<string | null>(null);
  const [lastChanged, setLastChanged] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Listen for currency change events
  useEffect(() => {
    const handleCurrencyEvent = (event: CustomEvent) => {
      const data = event.detail;
      const timestamp = new Date().toLocaleTimeString();
      
      // Update the last changed timestamp
      setLastChanged(`${timestamp} - ${data.oldCurrency || 'Unknown'} → ${data.currency || data.newCurrency}`);
      
      // Show a toast notification
      toast({
        title: "Currency Updated",
        description: `Changed from ${data.oldCurrency || 'previous currency'} to ${data.currency || data.newCurrency}`,
      });
    };
    
    window.addEventListener('currency_changed', handleCurrencyEvent as EventListener);
    
    return () => {
      window.removeEventListener('currency_changed', handleCurrencyEvent as EventListener);
    };
  }, [toast]);
  
  const handleCurrencyChange = async (currencyCode: string) => {
    if (isChangingCurrency) return;
    
    setError(null);
    
    try {
      // Use the proper hook to change currency
      setCurrency(currencyCode as Currency);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      // The toast notification is already handled in the hook
    }
  };
  
  const getCurrencyExchangeInfo = (currencyCode: string) => {
    // Create a simpler exchange rate structure
    const exchangeRates = {
      [Currency.USD]: {
        [Currency.BDT]: 110,
        [Currency.INR]: 83,
        [Currency.BTC]: 0.000018,
        [Currency.JPY]: 145,
      },
      [Currency.BDT]: {
        [Currency.USD]: 0.0091,
        [Currency.INR]: 0.76,
        [Currency.BTC]: 0.00000016,
        [Currency.JPY]: 1.32,
      },
      [Currency.INR]: {
        [Currency.USD]: 0.012,
        [Currency.BDT]: 1.32,
        [Currency.BTC]: 0.00000022,
        [Currency.JPY]: 1.74,
      },
      [Currency.BTC]: {
        [Currency.USD]: 56000,
        [Currency.BDT]: 6160000,
        [Currency.INR]: 4648000,
        [Currency.JPY]: 8120000,
      },
      [Currency.JPY]: {
        [Currency.USD]: 0.0069,
        [Currency.BDT]: 0.76,
        [Currency.INR]: 0.57,
        [Currency.BTC]: 0.00000012,
      },
    };
    
    // Format exchange rate info using our Intl.NumberFormat utility
    if (currencyCode && Object.values(Currency).includes(currencyCode as Currency)) {
      const baseCurrency = currencyCode as Currency;
      const otherCurrencies = Object.values(Currency).filter(c => c !== baseCurrency);
      
      try {
        return `1 ${baseCurrency} = ${otherCurrencies.map(currency => {
          const targetCurrency = currency as Currency;
          const rates = exchangeRates[baseCurrency] || {};
          const rate = rates[targetCurrency] || 0;
          return rate.toFixed(rate < 0.01 ? 8 : 2) + ' ' + targetCurrency;
        }).join(' = ')}`;
      } catch (error) {
        console.error("Error processing exchange rates:", error);
        return "Exchange rate information unavailable";
      }
    }
    
    return "";
  };
  
  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <DollarSign className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold">Currency Switcher</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-card rounded-lg p-6 shadow-lg animate-fadeIn">
            <h2 className="text-xl font-semibold mb-6">Select Your Currency</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currencies.map((currencyOption) => (
                <div
                  key={currencyOption.id}
                  onClick={() => handleCurrencyChange(currencyOption.code)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                    currencyOption.code === currentCurrency
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-background-light"
                  } ${isChangingCurrency ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{currencyOption.icon}</span>
                      <span className="text-lg font-semibold">{currencyOption.code}</span>
                    </div>
                    {currencyOption.code === currentCurrency && (
                      <Check className="h-5 w-5 text-primary animate-fadeIn" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{currencyOption.name}</p>
                  <div className="flex items-center space-x-1">
                    <span className="text-2xl font-semibold">{currencyOption.symbol}</span>
                    <span className="text-gray-400 text-sm">({currencyOption.code})</span>
                  </div>
                </div>
              ))}
            </div>
            
            {error && (
              <div className="mt-6 p-3 bg-red-500/20 text-red-400 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="mt-6 p-4 bg-background rounded-lg">
              <h3 className="font-semibold mb-2">Exchange Rates</h3>
              <p className="text-sm text-gray-400">{getCurrencyExchangeInfo(currentCurrency)}</p>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 shadow-lg animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Current Balance</h2>
                <div className="p-4 border rounded-lg bg-background-light shadow-sm mb-4">
                  <div className="mb-4">
                    <BalanceDisplay />
                  </div>
                  
                  {lastChanged && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Last currency change: {lastChanged}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 text-sm">
                    <div className="flex items-center text-muted-foreground mb-2">
                      <Info className="h-4 w-4 mr-2" />
                      <span>All changes happen in real-time</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      {isConnected ? (
                        <div className="flex items-center text-green-500">
                          <Wifi className="h-4 w-4 mr-2" />
                          <span>WebSocket connected</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-destructive">
                          <WifiOff className="h-4 w-4 mr-2" />
                          <span>WebSocket disconnected</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!user && (
                    <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md">
                      <p className="text-sm">You are not logged in. Balance updates may not work properly.</p>
                      <button 
                        onClick={() => window.location.href = '/auth'}
                        className="mt-2 w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Login or Register
                      </button>
                    </div>
                  )}
                  
                  {user && !isConnected && (
                    <div className="mt-4 p-3 bg-warning/10 text-warning rounded-md">
                      <p className="text-sm">WebSocket connection is down. Try refreshing the page or logging in again.</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button 
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-muted text-white rounded-md hover:bg-muted/90 transition-colors"
                        >
                          Refresh Page
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              // Make logout API call
                              await apiRequest('POST', '/api/logout');
                              // Clear local storage
                              localStorage.removeItem('authToken');
                              localStorage.removeItem('jwt');
                              // Redirect to login page
                              window.location.href = '/auth';
                            } catch (err) {
                              toast({
                                title: 'Logout failed',
                                description: 'There was an error logging out. Please try again.',
                                variant: 'destructive'
                              });
                            }
                          }}
                          className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors"
                        >
                          Re-Login
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">About Currencies</h2>
                <p className="text-gray-400 mb-4">
                  Changing your currency affects how your balance and bets are displayed.
                  All transactions will be processed in your selected currency.
                </p>
                
                <div className="bg-background p-4 rounded-lg">
                  <h3 className="font-semibold text-sm mb-2">IMPORTANT</h3>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li>• Your balance will be converted to the new currency automatically</li>
                    <li>• The exchange rates are updated daily</li>
                    <li>• You can change your currency at any time</li>
                    <li>• Minimum bet amounts vary by currency</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}