import { Currency } from "@shared/schema";

// Currency metadata including symbols, names, and flags
export const currencyMetadata: Record<Currency, {
  name: string;
  symbol: string;
  code: string;
  icon: string;
  region: string;
}> = {
  // Main currencies
  [Currency.USD]: {
    name: "US Dollar",
    symbol: "$",
    code: "USD",
    icon: "🇺🇸",
    region: "North America"
  },
  [Currency.BDT]: {
    name: "Bangladeshi Taka",
    symbol: "৳",
    code: "BDT",
    icon: "🇧🇩",
    region: "Asia"
  },
  [Currency.INR]: {
    name: "Indian Rupee",
    symbol: "₹",
    code: "INR",
    icon: "🇮🇳",
    region: "Asia"
  },
  [Currency.BTC]: {
    name: "Bitcoin",
    symbol: "₿",
    code: "BTC",
    icon: "🪙",
    region: "Cryptocurrency"
  },
  [Currency.JPY]: {
    name: "Japanese Yen",
    symbol: "¥",
    code: "JPY",
    icon: "🇯🇵",
    region: "Asia"
  },
  
  // Additional major currencies
  [Currency.EUR]: {
    name: "Euro",
    symbol: "€",
    code: "EUR",
    icon: "🇪🇺",
    region: "Europe"
  },
  [Currency.GBP]: {
    name: "British Pound",
    symbol: "£",
    code: "GBP",
    icon: "🇬🇧",
    region: "Europe"
  },
  [Currency.CAD]: {
    name: "Canadian Dollar",
    symbol: "$",
    code: "CAD",
    icon: "🇨🇦",
    region: "North America"
  },
  [Currency.AUD]: {
    name: "Australian Dollar",
    symbol: "$",
    code: "AUD",
    icon: "🇦🇺", 
    region: "Oceania"
  },
  [Currency.CNY]: {
    name: "Chinese Yuan",
    symbol: "¥",
    code: "CNY",
    icon: "🇨🇳",
    region: "Asia"
  },
  
  // European currencies
  [Currency.CHF]: {
    name: "Swiss Franc",
    symbol: "Fr",
    code: "CHF",
    icon: "🇨🇭",
    region: "Europe"
  },
  [Currency.SEK]: {
    name: "Swedish Krona",
    symbol: "kr",
    code: "SEK",
    icon: "🇸🇪",
    region: "Europe"
  },
  [Currency.NOK]: {
    name: "Norwegian Krone",
    symbol: "kr",
    code: "NOK",
    icon: "🇳🇴",
    region: "Europe"
  },
  [Currency.DKK]: {
    name: "Danish Krone",
    symbol: "kr",
    code: "DKK",
    icon: "🇩🇰",
    region: "Europe"
  },
  [Currency.PLN]: {
    name: "Polish Złoty",
    symbol: "zł",
    code: "PLN",
    icon: "🇵🇱",
    region: "Europe"
  },
  
  // Asian currencies
  [Currency.HKD]: {
    name: "Hong Kong Dollar",
    symbol: "$",
    code: "HKD",
    icon: "🇭🇰",
    region: "Asia"
  },
  [Currency.SGD]: {
    name: "Singapore Dollar",
    symbol: "$",
    code: "SGD",
    icon: "🇸🇬",
    region: "Asia"
  },
  [Currency.THB]: {
    name: "Thai Baht",
    symbol: "฿",
    code: "THB",
    icon: "🇹🇭",
    region: "Asia"
  },
  [Currency.KRW]: {
    name: "South Korean Won",
    symbol: "₩",
    code: "KRW",
    icon: "🇰🇷",
    region: "Asia"
  },
  [Currency.IDR]: {
    name: "Indonesian Rupiah",
    symbol: "Rp",
    code: "IDR",
    icon: "🇮🇩",
    region: "Asia"
  },
  
  // Middle Eastern currencies
  [Currency.AED]: {
    name: "UAE Dirham",
    symbol: "د.إ",
    code: "AED",
    icon: "🇦🇪",
    region: "Middle East"
  },
  [Currency.SAR]: {
    name: "Saudi Riyal",
    symbol: "﷼",
    code: "SAR",
    icon: "🇸🇦",
    region: "Middle East"
  },
  [Currency.TRY]: {
    name: "Turkish Lira",
    symbol: "₺",
    code: "TRY",
    icon: "🇹🇷",
    region: "Middle East"
  },
  [Currency.ILS]: {
    name: "Israeli New Shekel",
    symbol: "₪",
    code: "ILS",
    icon: "🇮🇱",
    region: "Middle East"
  },
  [Currency.QAR]: {
    name: "Qatari Riyal",
    symbol: "﷼",
    code: "QAR",
    icon: "🇶🇦",
    region: "Middle East"
  },
  
  // Americas currencies
  [Currency.MXN]: {
    name: "Mexican Peso",
    symbol: "$",
    code: "MXN",
    icon: "🇲🇽",
    region: "North America"
  },
  [Currency.BRL]: {
    name: "Brazilian Real",
    symbol: "R$",
    code: "BRL",
    icon: "🇧🇷",
    region: "South America"
  },
  [Currency.ARS]: {
    name: "Argentine Peso",
    symbol: "$",
    code: "ARS",
    icon: "🇦🇷",
    region: "South America"
  },
  [Currency.CLP]: {
    name: "Chilean Peso",
    symbol: "$",
    code: "CLP",
    icon: "🇨🇱",
    region: "South America"
  },
  [Currency.COP]: {
    name: "Colombian Peso",
    symbol: "$",
    code: "COP",
    icon: "🇨🇴",
    region: "South America"
  },
  
  // African currencies
  [Currency.ZAR]: {
    name: "South African Rand",
    symbol: "R",
    code: "ZAR",
    icon: "🇿🇦",
    region: "Africa"
  },
  [Currency.NGN]: {
    name: "Nigerian Naira",
    symbol: "₦",
    code: "NGN",
    icon: "🇳🇬",
    region: "Africa"
  },
  [Currency.EGP]: {
    name: "Egyptian Pound",
    symbol: "£",
    code: "EGP",
    icon: "🇪🇬",
    region: "Africa"
  },
  [Currency.KES]: {
    name: "Kenyan Shilling",
    symbol: "KSh",
    code: "KES",
    icon: "🇰🇪",
    region: "Africa"
  },
  [Currency.GHS]: {
    name: "Ghanaian Cedi",
    symbol: "₵",
    code: "GHS",
    icon: "🇬🇭",
    region: "Africa"
  },
  
  // Other cryptocurrencies
  [Currency.ETH]: {
    name: "Ethereum",
    symbol: "Ξ",
    code: "ETH",
    icon: "💎",
    region: "Cryptocurrency"
  },
  [Currency.USDT]: {
    name: "Tether",
    symbol: "₮",
    code: "USDT",
    icon: "💰",
    region: "Cryptocurrency"
  },
  [Currency.XRP]: {
    name: "XRP",
    symbol: "✘",
    code: "XRP",
    icon: "💧",
    region: "Cryptocurrency"
  },
  [Currency.LTC]: {
    name: "Litecoin",
    symbol: "Ł",
    code: "LTC",
    icon: "🥈",
    region: "Cryptocurrency"
  }
};

// Get currencies by region
export function getCurrenciesByRegion() {
  const regions: Record<string, Currency[]> = {};
  
  Object.entries(currencyMetadata).forEach(([currency, metadata]) => {
    if (!regions[metadata.region]) {
      regions[metadata.region] = [];
    }
    regions[metadata.region].push(currency as Currency);
  });
  
  return regions;
}

// Default exchange rates for the main currencies
export const defaultExchangeRates: Record<string, Record<string, number>> = {
  USD: {
    EUR: 0.93,
    GBP: 0.79,
    JPY: 145,
    BTC: 0.00001,
    INR: 85.6,
    BDT: 121.53,
    CAD: 1.36,
    AUD: 1.52,
    CNY: 7.25
  }
};

// Format currency with appropriate symbol
export function formatCurrencyDisplay(amount: number, currency: Currency): string {
  const metadata = currencyMetadata[currency];
  
  if (!metadata) {
    console.warn(`No metadata found for currency: ${currency}`);
    return `$ ${amount.toFixed(2)}`;
  }
  
  // Special formatting for cryptocurrencies
  if (currency === Currency.BTC || currency === Currency.ETH || 
      currency === Currency.XRP || currency === Currency.LTC || 
      currency === Currency.USDT) {
    return `${metadata.symbol} ${amount.toFixed(8)}`;
  }
  
  // Special formatting for currencies that don't use decimal places
  if (currency === Currency.JPY || currency === Currency.KRW || 
      currency === Currency.IDR || currency === Currency.CLP || 
      currency === Currency.COP) {
    return `${metadata.symbol} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }
  
  // Regular currency formatting
  return `${metadata.symbol} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}