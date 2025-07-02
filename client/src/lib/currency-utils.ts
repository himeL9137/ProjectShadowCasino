import { Currency } from "@shared/schema";

/**
 * Map of currency codes to their locale and symbol information
 */
const CURRENCY_CONFIG: Record<string, { 
  locale: string, 
  currency: string,
  symbolDisplay?: 'symbol' | 'code' | 'narrowSymbol',
  symbolPosition?: 'before' | 'after',
  decimalDigits?: [number, number]  // [min, max]
}> = {
  // Main currencies
  [Currency.USD]: { 
    locale: 'en-US', 
    currency: 'USD',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.BDT]: { 
    locale: 'bn-BD', 
    currency: 'BDT',
    symbolDisplay: 'narrowSymbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.INR]: { 
    locale: 'en-IN', 
    currency: 'INR',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2] 
  },
  [Currency.BTC]: { 
    locale: 'en-US', 
    currency: 'BTC',
    symbolDisplay: 'code',
    symbolPosition: 'before',
    decimalDigits: [6, 8] 
  },
  [Currency.JPY]: { 
    locale: 'ja-JP', 
    currency: 'JPY',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [0, 0] 
  },
  
  // Additional major currencies
  [Currency.EUR]: { 
    locale: 'de-DE', 
    currency: 'EUR',
    symbolDisplay: 'symbol',
    symbolPosition: 'after',
    decimalDigits: [2, 2]
  },
  [Currency.GBP]: { 
    locale: 'en-GB', 
    currency: 'GBP',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.CAD]: { 
    locale: 'en-CA', 
    currency: 'CAD',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.AUD]: { 
    locale: 'en-AU', 
    currency: 'AUD',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.CNY]: { 
    locale: 'zh-CN', 
    currency: 'CNY',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  
  // European currencies
  [Currency.CHF]: { 
    locale: 'de-CH', 
    currency: 'CHF',
    symbolDisplay: 'symbol',
    symbolPosition: 'after',
    decimalDigits: [2, 2]
  },
  [Currency.SEK]: { 
    locale: 'sv-SE', 
    currency: 'SEK',
    symbolDisplay: 'symbol',
    symbolPosition: 'after',
    decimalDigits: [2, 2]
  },
  [Currency.NOK]: { 
    locale: 'no-NO', 
    currency: 'NOK',
    symbolDisplay: 'symbol',
    symbolPosition: 'after',
    decimalDigits: [2, 2]
  },
  [Currency.DKK]: { 
    locale: 'da-DK', 
    currency: 'DKK',
    symbolDisplay: 'symbol',
    symbolPosition: 'after',
    decimalDigits: [2, 2]
  },
  [Currency.PLN]: { 
    locale: 'pl-PL', 
    currency: 'PLN',
    symbolDisplay: 'symbol',
    symbolPosition: 'after',
    decimalDigits: [2, 2]
  },
  
  // Asian currencies
  [Currency.HKD]: { 
    locale: 'zh-HK', 
    currency: 'HKD',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.SGD]: { 
    locale: 'en-SG', 
    currency: 'SGD',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.THB]: { 
    locale: 'th-TH', 
    currency: 'THB',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.KRW]: { 
    locale: 'ko-KR', 
    currency: 'KRW',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [0, 0] // No decimal places for Korean Won
  },
  [Currency.IDR]: { 
    locale: 'id-ID', 
    currency: 'IDR',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [0, 0] // Usually no decimal places
  },
  
  // Middle Eastern currencies
  [Currency.AED]: { 
    locale: 'ar-AE', 
    currency: 'AED',
    symbolDisplay: 'symbol',
    symbolPosition: 'after',
    decimalDigits: [2, 2]
  },
  [Currency.SAR]: { 
    locale: 'ar-SA', 
    currency: 'SAR',
    symbolDisplay: 'symbol',
    symbolPosition: 'after',
    decimalDigits: [2, 2]
  },
  [Currency.TRY]: { 
    locale: 'tr-TR', 
    currency: 'TRY',
    symbolDisplay: 'symbol',
    symbolPosition: 'after',
    decimalDigits: [2, 2]
  },
  [Currency.ILS]: { 
    locale: 'he-IL', 
    currency: 'ILS',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.QAR]: { 
    locale: 'ar-QA', 
    currency: 'QAR',
    symbolDisplay: 'symbol',
    symbolPosition: 'after',
    decimalDigits: [2, 2]
  },
  
  // Americas currencies
  [Currency.MXN]: { 
    locale: 'es-MX', 
    currency: 'MXN',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.BRL]: { 
    locale: 'pt-BR', 
    currency: 'BRL',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.ARS]: { 
    locale: 'es-AR', 
    currency: 'ARS',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.CLP]: { 
    locale: 'es-CL', 
    currency: 'CLP',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [0, 0] // No decimal places for Chilean Peso
  },
  [Currency.COP]: { 
    locale: 'es-CO', 
    currency: 'COP',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [0, 0] // No decimal places for Colombian Peso
  },
  
  // African currencies
  [Currency.ZAR]: { 
    locale: 'en-ZA', 
    currency: 'ZAR',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.NGN]: { 
    locale: 'en-NG', 
    currency: 'NGN',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.EGP]: { 
    locale: 'ar-EG', 
    currency: 'EGP',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.KES]: { 
    locale: 'sw-KE', 
    currency: 'KES',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  [Currency.GHS]: { 
    locale: 'en-GH', 
    currency: 'GHS',
    symbolDisplay: 'symbol',
    symbolPosition: 'before',
    decimalDigits: [2, 2]
  },
  
  // Other cryptocurrencies
  [Currency.ETH]: { 
    locale: 'en-US', 
    currency: 'ETH',
    symbolDisplay: 'code',
    symbolPosition: 'before',
    decimalDigits: [6, 8]
  },
  [Currency.USDT]: { 
    locale: 'en-US', 
    currency: 'USDT',
    symbolDisplay: 'code',
    symbolPosition: 'before',
    decimalDigits: [2, 6]
  },
  [Currency.XRP]: { 
    locale: 'en-US', 
    currency: 'XRP',
    symbolDisplay: 'code',
    symbolPosition: 'before',
    decimalDigits: [6, 8]
  },
  [Currency.LTC]: { 
    locale: 'en-US', 
    currency: 'LTC',
    symbolDisplay: 'code',
    symbolPosition: 'before',
    decimalDigits: [6, 8]
  }
};

/**
 * Formats a number amount to a currency string with the appropriate
 * locale, symbol, and decimal places based on the currency
 */
import { currencyMetadata } from "./currency-data";

export function formatCurrency(amount: number | string, currency: Currency, compact?: boolean): string {
  
  // Handle undefined, null, NaN or empty string
  if (amount === undefined || amount === null || amount === '' || 
      (typeof amount === 'number' && isNaN(amount))) {
    console.warn(`Invalid amount provided to formatCurrency: ${amount}`);
    // Return a fallback value with the correct currency symbol
    return getCurrencySymbol(currency) + '0.00';
  }
  
  // Parse string values to numbers
  let numericAmount: number;
  try {
    numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Ensure the amount is a valid number even after parsing
    if (isNaN(numericAmount)) {
      console.warn(`Amount parsed to NaN in formatCurrency: ${amount}`);
      // Return a fallback value
      return getCurrencySymbol(currency) + '0.00';
    }
  } catch (error) {
    console.error('Error parsing amount in formatCurrency:', error);
    // Return a fallback value
    return getCurrencySymbol(currency) + '0.00';
  }
  
  // Get currency configuration
  const config = CURRENCY_CONFIG[currency];
  
  // Handle compact formatting for large numbers to prevent overflow
  if (compact && numericAmount >= 1000) {
    const symbol = getCurrencySymbol(currency);
    
    if (numericAmount >= 1000000) {
      // Format millions
      return `${symbol}${(numericAmount / 1000000).toFixed(1)}M`;
    } else if (numericAmount >= 1000) {
      // Format thousands
      return `${symbol}${(numericAmount / 1000).toFixed(1)}K`;
    }
  }
  
  // Handle cryptocurrency special cases
  if (currency === Currency.BTC || currency === Currency.ETH || 
      currency === Currency.XRP || currency === Currency.LTC || 
      currency === Currency.USDT) {
    // Format crypto with proper decimal places and symbol
    return `${getCurrencySymbol(currency)}${numericAmount.toFixed(config?.decimalDigits?.[0] || 8)}`;
  }
  
  try {
    // Use Intl.NumberFormat for standard currencies
    if (config) {
      const formatter = new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.currency,
        currencyDisplay: config.symbolDisplay || 'symbol',
        minimumFractionDigits: config.decimalDigits?.[0] || 2,
        maximumFractionDigits: config.decimalDigits?.[1] || 2,
        // Add compact notation for very large numbers
        notation: compact && numericAmount >= 100000 ? 'compact' : 'standard'
      });
      
      return formatter.format(numericAmount);
    } else {
      // For currencies without specific config, use generic formatting with correct symbol
      return `${getCurrencySymbol(currency)}${numericAmount.toFixed(2)}`;
    }
  } catch (error) {
    console.error('Error formatting currency with Intl.NumberFormat:', error);
    // Fallback to basic formatting in case Intl.NumberFormat fails
    return `${getCurrencySymbol(currency)}${numericAmount.toFixed(2)}`;
  }
}

/**
 * Gets the symbol for a given currency
 */
export function getCurrencySymbol(currency: Currency): string {
  
  // Use metadata to get the correct symbol
  if (currencyMetadata[currency]) {
    return currencyMetadata[currency].symbol;
  }
  
  // Fallback for missing currencies
  switch (currency) {
    case Currency.USD:
      return "$";
    case Currency.BDT:
      return "৳";
    case Currency.INR:
      return "₹";
    case Currency.BTC:
      return "₿";
    case Currency.JPY:
      return "¥";
    case Currency.EUR:
      return "€";
    case Currency.GBP:
      return "£";
    case Currency.CAD:
      return "C$";
    case Currency.AUD:
      return "A$";
    case Currency.CNY:
      return "¥";
    case Currency.CHF:
      return "Fr";
    case Currency.SEK:
      return "kr";
    case Currency.NOK:
      return "kr";
    case Currency.DKK:
      return "kr";
    case Currency.PLN:
      return "zł";
    case Currency.HKD:
      return "HK$";
    case Currency.SGD:
      return "S$";
    case Currency.THB:
      return "฿";
    case Currency.KRW:
      return "₩";
    case Currency.IDR:
      return "Rp";
    case Currency.AED:
      return "د.إ";
    case Currency.SAR:
      return "﷼";
    case Currency.TRY:
      return "₺";
    case Currency.ILS:
      return "₪";
    case Currency.QAR:
      return "﷼";
    case Currency.MXN:
      return "Mex$";
    case Currency.BRL:
      return "R$";
    case Currency.ARS:
      return "AR$";
    case Currency.CLP:
      return "CL$";
    case Currency.COP:
      return "COL$";
    case Currency.ZAR:
      return "R";
    case Currency.NGN:
      return "₦";
    case Currency.EGP:
      return "E£";
    case Currency.KES:
      return "KSh";
    case Currency.GHS:
      return "₵";
    case Currency.ETH:
      return "Ξ";
    case Currency.USDT:
      return "₮";
    case Currency.XRP:
      return "✘";
    case Currency.LTC:
      return "Ł";
    default:
      return "$";
  }
}

/**
 * Stores the user's currency preference in localStorage
 */
export function saveUserCurrencyPreference(currency: Currency): void {
  try {
    localStorage.setItem('preferred_currency', currency);
    console.log(`Saved currency preference: ${currency} to localStorage`);
  } catch (err) {
    console.warn('Unable to save currency preference to localStorage:', err);
  }
}

/**
 * Retrieves the user's stored currency preference from localStorage
 */
export function getUserCurrencyPreference(): Currency | null {
  try {
    const saved = localStorage.getItem('preferred_currency');
    return saved as Currency || null;
  } catch (err) {
    console.warn('Unable to retrieve currency preference from localStorage:', err);
    return null;
  }
}

/**
 * Creates a CustomEvent for currency change to broadcast to all components
 */
export function dispatchCurrencyChangeEvent(oldCurrency: Currency, newCurrency: Currency, oldBalance?: string, newBalance?: string): void {
  // Create a custom event with currency change details
  const eventDetail = {
    oldCurrency,
    newCurrency, 
    oldBalance,
    newBalance,
    timestamp: new Date().toISOString()
  };
  
  // Create and dispatch the event
  const event = new CustomEvent('currency_changed', { 
    detail: eventDetail,
    bubbles: true
  });
  
  console.log('Dispatching currency_changed event:', eventDetail);
  window.dispatchEvent(event);
}