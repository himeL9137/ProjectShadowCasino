import { useState } from "react";
import { Check, DollarSign, RefreshCw } from "lucide-react";
import { Currency } from "@shared/schema";
import { useCurrency } from "@/hooks/use-currency";

// Define available currencies with metadata for display
const currencies = [
  {
    id: 1,
    code: Currency.USD,
    name: "US Dollar",
    symbol: "$",
    icon: "🇺🇸",
  },
  {
    id: 2,
    code: Currency.BDT,
    name: "Bangladeshi Taka",
    symbol: "৳",
    icon: "🇧🇩",
  },
  {
    id: 3,
    code: Currency.INR,
    name: "Indian Rupee",
    symbol: "₹",
    icon: "🇮🇳",
  },
  {
    id: 4,
    code: Currency.BTC,
    name: "Bitcoin",
    symbol: "₿",
    icon: "🪙",
  },
];

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: Currency) => void;
  displayMode?: "grid" | "dropdown" | "inline";
  size?: "small" | "medium" | "large";
  showExchangeRates?: boolean;
}

export function CurrencySelector({ 
  onCurrencyChange,
  displayMode = "grid",
  size = "medium",
  showExchangeRates = false
}: CurrencySelectorProps) {
  const { 
    currency: currentCurrency, 
    setCurrency, 
    isChangingCurrency: isSwitchingCurrency,
    exchangeRates,
    isLoadingRates,
    getConversionRate,
    availableCurrencies
  } = useCurrency();
  const [error, setError] = useState<string | null>(null);
  
  const handleCurrencyChange = async (currencyCode: Currency) => {
    if (isSwitchingCurrency) return;
    
    setError(null);
    
    try {
      await setCurrency(currencyCode);
      if (onCurrencyChange) {
        onCurrencyChange(currencyCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Currency change failed');
    }
  };
  
  const getCurrencyExchangeInfo = (currencyCode: Currency) => {
    if (isLoadingRates) {
      return "Loading exchange rates...";
    }
    
    if (!exchangeRates || !exchangeRates.rates) {
      return "Exchange rates unavailable";
    }
    
    // Format exchange rate info based on real rates
    try {
      // Exclude the current currency from the output
      const otherCurrencies = availableCurrencies.filter(c => c !== currencyCode);
      
      const rateInfos = otherCurrencies.map(otherCurrency => {
        const rate = getConversionRate(currencyCode, otherCurrency);
        
        if (rate === null) {
          return `[${otherCurrency} rate unavailable]`;
        }
        
        // Format the rate appropriately
        let formattedRate = rate.toString();
        
        // Special formatting for BTC due to small/large values
        if (currencyCode === Currency.BTC) {
          // When converting from BTC to others, likely large numbers
          formattedRate = rate.toLocaleString(undefined, { maximumFractionDigits: 0 });
        } else if (otherCurrency === Currency.BTC) {
          // When converting to BTC, likely very small numbers
          formattedRate = rate.toFixed(8);
        } else {
          // Normal fiat to fiat conversion
          formattedRate = rate.toFixed(2);
        }
        
        return `${formattedRate} ${otherCurrency}`;
      });
      
      return `1 ${currencyCode} = ${rateInfos.join(' = ')}`;
    } catch (error) {
      console.error('Error formatting exchange rate info:', error);
      return "Error calculating exchange rates";
    }
  };
  
  // Styles based on size
  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "text-sm p-2";
      case "large":
        return "text-lg p-6";
      case "medium":
      default:
        return "text-base p-4";
    }
  };
  
  // Simple inline selector (horizontal row of buttons)
  if (displayMode === "inline") {
    return (
      <div className="currency-selector">
        <div className="flex space-x-2 items-center">
          {currencies.map((currency) => (
            <button
              key={currency.id}
              onClick={() => handleCurrencyChange(currency.code)}
              className={`px-3 py-1 rounded-md transition-colors ${
                currentCurrency === currency.code
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-background-light"
              } ${isSwitchingCurrency ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              disabled={isSwitchingCurrency}
            >
              <span className="mr-1">{currency.icon}</span>
              <span>{currency.code}</span>
            </button>
          ))}
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    );
  }
  
  // Dropdown selector placeholder (can be expanded later)
  if (displayMode === "dropdown") {
    return (
      <div className="currency-selector">
        <select 
          value={currentCurrency}
          onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
          className="bg-background border border-border rounded p-2"
          disabled={isSwitchingCurrency}
        >
          {currencies.map((currency) => (
            <option key={currency.id} value={currency.code}>
              {currency.icon} {currency.code} - {currency.name}
            </option>
          ))}
        </select>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    );
  }
  
  // Default grid selector (similar to the CurrencyPage display)
  return (
    <div className="currency-selector">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currencies.map((currency) => (
          <div
            key={currency.id}
            onClick={() => handleCurrencyChange(currency.code)}
            className={`border rounded-lg ${getSizeClasses()} cursor-pointer transition-all duration-300 ${
              currentCurrency === currency.code
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-background-light"
            } ${isSwitchingCurrency ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{currency.icon}</span>
                <span className="text-lg font-semibold">{currency.code}</span>
              </div>
              {currentCurrency === currency.code && (
                <Check className="h-5 w-5 text-primary animate-fadeIn" />
              )}
            </div>
            <p className="text-sm text-gray-400 mb-2">{currency.name}</p>
            <div className="flex items-center space-x-1">
              <span className="text-2xl font-semibold">{currency.symbol}</span>
              <span className="text-gray-400 text-sm">({currency.code})</span>
            </div>
          </div>
        ))}
      </div>
      
      {error && (
        <div className="mt-6 p-3 bg-red-500/20 text-red-400 rounded-md flex items-center">
          <span>{error}</span>
        </div>
      )}
      
      {showExchangeRates && (
        <div className="mt-6 p-4 bg-background rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Exchange Rates</h3>
            {isLoadingRates && (
              <div className="flex items-center text-blue-400">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span className="text-xs">Updating...</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400">{getCurrencyExchangeInfo(currentCurrency)}</p>
          {exchangeRates && (
            <div className="text-xs text-gray-500 mt-2">
              Last updated: {new Date(exchangeRates.lastUpdated).toLocaleString()} 
              ({exchangeRates.ageInMinutes < 1 ? 'Just now' : `${exchangeRates.ageInMinutes} minutes ago`})
            </div>
          )}
        </div>
      )}
    </div>
  );
}