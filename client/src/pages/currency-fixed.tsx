import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DollarSign, Check, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/hooks/use-currency";
import { Currency } from "@shared/schema";

// All currencies including JPY
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

export default function CurrencyFixedPage() {
  const { user } = useAuth();
  const { 
    currency: currentCurrency, 
    setCurrency, 
    isChangingCurrency, 
    exchangeRates 
  } = useCurrency();
  
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleCurrencyChange = async (currencyCode: Currency) => {
    if (isChangingCurrency) return;
    
    setError(null);
    
    try {
      await setCurrency(currencyCode);
      
      toast({
        title: "Currency Updated",
        description: `Your currency has been changed to ${currencyCode}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      
      toast({
        title: "Currency Change Failed",
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: "destructive"
      });
    }
  };
  
  const getExchangeRateDisplay = (currency: Currency) => {
    if (!exchangeRates || !exchangeRates.rates) {
      return "Exchange rates unavailable";
    }
    
    try {
      const rates = exchangeRates.rates;
      const otherCurrencies = Object.keys(rates).filter(code => code !== currency);
      
      return `1 ${currency} = ${otherCurrencies.map(code => {
        const rate = currency === 'USD' 
          ? rates[code] 
          : code === 'USD' 
            ? (1 / rates[currency]) 
            : (rates[code] / rates[currency]);
            
        // Format based on value size
        const formattedRate = rate < 0.01 ? rate.toFixed(8) : rate.toFixed(2);
        return `${formattedRate} ${code}`;
      }).join(' | ')}`;
    } catch (err) {
      console.error("Error displaying exchange rates:", err);
      return "Error calculating exchange rates";
    }
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <DollarSign className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold">Currency Settings</h1>
        </div>
        
        <div className="bg-card rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Select Your Currency</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {currencies.map((currencyOption) => (
              <div
                key={currencyOption.id}
                onClick={() => handleCurrencyChange(currencyOption.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  currencyOption.id === currentCurrency
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-background/5"
                } ${isChangingCurrency ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{currencyOption.icon}</span>
                    <span className="text-lg font-semibold">{currencyOption.code}</span>
                  </div>
                  {currencyOption.id === currentCurrency && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{currencyOption.name}</p>
                <div className="flex items-center space-x-1">
                  <span className="text-xl font-semibold">{currencyOption.symbol}</span>
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
          
          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Exchange Rates</h3>
            <p className="text-sm text-muted-foreground">
              {getExchangeRateDisplay(currentCurrency)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <Info className="inline h-3 w-3 mr-1" />
              Exchange rates are updated every 5 minutes
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">About Currencies</h3>
              <p className="text-sm text-muted-foreground">
                Changing your currency affects how your balance and bets are displayed.
                All transactions will be processed in your selected currency.
              </p>
            </div>
            
            <div className="bg-muted/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Important Notes</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your balance will be converted automatically</li>
                <li>• Exchange rates are updated daily</li>
                <li>• Minimum bet amounts vary by currency</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}