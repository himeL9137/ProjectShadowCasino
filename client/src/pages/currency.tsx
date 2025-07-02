import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Check, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

// Fixed exchange rates for display
const exchangeRates = {
  USD: {
    BDT: 110.0,
    INR: 83.5,
    BTC: 0.000018,
    JPY: 145.0
  },
  BDT: {
    USD: 0.0091,
    INR: 0.76,
    BTC: 0.00000016,
    JPY: 1.32
  },
  INR: {
    USD: 0.012,
    BDT: 1.32,
    BTC: 0.00000022,
    JPY: 1.74
  },
  BTC: {
    USD: 56000,
    BDT: 6160000,
    INR: 4648000,
    JPY: 8120000
  },
  JPY: {
    USD: 0.0069,
    BDT: 0.76,
    INR: 0.57,
    BTC: 0.00000012
  }
};

export default function CurrencyPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.USD);
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  const handleCurrencyChange = async (currencyCode: Currency) => {
    if (isChanging || selectedCurrency === currencyCode) return;
    
    setIsChanging(true);
    
    try {
      // Simulate currency change (this would connect to your provider in real implementation)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update the state
      setSelectedCurrency(currencyCode);
      
      // Show success notification
      toast({
        title: "Currency Changed",
        description: `Your currency has been updated to ${currencyCode}`,
      });
    } catch (error) {
      // Show error notification
      toast({
        title: "Error",
        description: "Failed to change currency. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };
  
  const formatExchangeRate = (value: number): string => {
    if (value < 0.01) return value.toFixed(8);
    return value.toFixed(2);
  };
  
  const getExchangeRateText = (baseCurrency: Currency): string => {
    const rates = exchangeRates[baseCurrency];
    if (!rates) return "Exchange rates unavailable";
    
    const otherCurrencies = Object.keys(rates).filter(code => code !== baseCurrency);
    
    return `1 ${baseCurrency} = ${otherCurrencies.map(code => 
      `${formatExchangeRate(rates[code])} ${code}`
    ).join(' | ')}`;
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
            {currencies.map((currency) => (
              <div
                key={currency.id}
                onClick={() => handleCurrencyChange(currency.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  currency.id === selectedCurrency
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-background/5"
                } ${isChanging ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{currency.icon}</span>
                    <span className="text-lg font-semibold">{currency.code}</span>
                  </div>
                  {currency.id === selectedCurrency && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{currency.name}</p>
                <div className="flex items-center space-x-1">
                  <span className="text-xl font-semibold">{currency.symbol}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Exchange Rates</h3>
            <p className="text-sm text-muted-foreground">{getExchangeRateText(selectedCurrency)}</p>
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