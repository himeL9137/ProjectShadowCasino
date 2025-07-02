
// Currency Converter v1.0.1
import { Currency } from "@shared/schema";
import axios from 'axios';

interface ExchangeRates {
    [key: string]: number;
}

class CurrencyConverter {
    private static instance: CurrencyConverter;
    private rates: ExchangeRates = {};
    private lastUpdate: Date = new Date(0);
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    private readonly FALLBACK_RATES: ExchangeRates = {
        USD: 1.0,
        BDT: 109.60,
        INR: 83.30,
        BTC: 0.000015
    };

    private constructor() {
        this.rates = { ...this.FALLBACK_RATES };
    }

    static getInstance(): CurrencyConverter {
        if (!CurrencyConverter.instance) {
            CurrencyConverter.instance = new CurrencyConverter();
        }
        return CurrencyConverter.instance;
    }

    async updateRates(): Promise<void> {
        try {
            const response = await axios.get('https://api.exchangerate.host/latest', {
                params: {
                    base: 'USD',
                    symbols: 'BDT,INR'
                }
            });

            if (response.data?.rates) {
                this.rates = {
                    USD: 1.0,
                    BDT: response.data.rates.BDT || this.FALLBACK_RATES.BDT,
                    INR: response.data.rates.INR || this.FALLBACK_RATES.INR,
                    BTC: this.FALLBACK_RATES.BTC // BTC from separate API or use fallback
                };
                this.lastUpdate = new Date();
                console.log('Exchange rates updated:', this.rates);
            }
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
            this.useDefaultRates();
        }
    }

    private useDefaultRates(): void {
        this.rates = { ...this.FALLBACK_RATES };
        console.log('Using fallback exchange rates:', this.rates);
    }

    async getRates(): Promise<ExchangeRates> {
        const now = new Date();
        if (now.getTime() - this.lastUpdate.getTime() > this.CACHE_DURATION) {
            await this.updateRates();
        }
        return this.rates;
    }

    async convert(amount: number, fromCurrency: Currency, toCurrency: Currency): Promise<number> {
        // Validate currencies
        if (!Object.values(Currency).includes(fromCurrency) || !Object.values(Currency).includes(toCurrency)) {
            throw new Error(`Invalid currency: ${fromCurrency} or ${toCurrency}`);
        }

        if (fromCurrency === toCurrency) return amount;

        const rates = await this.getRates();
        
        // Validate rates exist
        if (!rates[fromCurrency] || !rates[toCurrency]) {
            console.error('Missing exchange rates:', { rates, fromCurrency, toCurrency });
            throw new Error(`Exchange rates not available for ${fromCurrency} or ${toCurrency}`);
        }

        // Convert to USD first, then to target currency
        const amountInUSD = amount / rates[fromCurrency];
        const convertedAmount = amountInUSD * rates[toCurrency];

        if (isNaN(convertedAmount)) {
            console.error('Conversion resulted in NaN:', { amount, fromCurrency, toCurrency, rates });
            throw new Error('Currency conversion failed');
        }

        // Round based on currency
        return this.roundByCurrency(convertedAmount, toCurrency);
    }

    private roundByCurrency(amount: number, currency: Currency): number {
        switch(currency) {
            case Currency.BTC:
                return parseFloat(amount.toFixed(8));
            default:
                return parseFloat(amount.toFixed(2));
        }
    }

    async getExchangeRate(fromCurrency: Currency, toCurrency: Currency): Promise<number> {
        const rates = await this.getRates();
        if (!rates[fromCurrency] || !rates[toCurrency]) {
            throw new Error(`Exchange rates not available for ${fromCurrency} or ${toCurrency}`);
        }
        return rates[toCurrency] / rates[fromCurrency];
    }
}

export const currencyConverter = CurrencyConverter.getInstance();

export function formatWithCurrency(amount: number, currency: Currency): string {
    const symbols: Record<string, string> = {
        // Main currencies
        [Currency.USD]: "$",
        [Currency.BDT]: "৳",
        [Currency.INR]: "₹",
        [Currency.BTC]: "₿",
        [Currency.JPY]: "¥",
        
        // Additional major currencies
        [Currency.EUR]: "€",
        [Currency.GBP]: "£",
        [Currency.CAD]: "$",
        [Currency.AUD]: "$",
        [Currency.CNY]: "¥",
        
        // European currencies
        [Currency.CHF]: "Fr",
        [Currency.SEK]: "kr",
        [Currency.NOK]: "kr",
        [Currency.DKK]: "kr",
        [Currency.PLN]: "zł",
        
        // Asian currencies
        [Currency.HKD]: "$",
        [Currency.SGD]: "$",
        [Currency.THB]: "฿",
        [Currency.KRW]: "₩",
        [Currency.IDR]: "Rp",
        
        // Middle Eastern currencies
        [Currency.AED]: "د.إ",
        [Currency.SAR]: "﷼",
        [Currency.TRY]: "₺",
        [Currency.ILS]: "₪",
        [Currency.QAR]: "﷼",
        
        // Americas currencies
        [Currency.MXN]: "$",
        [Currency.BRL]: "R$",
        [Currency.ARS]: "$",
        [Currency.CLP]: "$",
        [Currency.COP]: "$",
        
        // African currencies
        [Currency.ZAR]: "R",
        [Currency.NGN]: "₦",
        [Currency.EGP]: "£",
        [Currency.KES]: "KSh",
        [Currency.GHS]: "₵",
        
        // Other cryptocurrencies
        [Currency.ETH]: "Ξ",
        [Currency.USDT]: "₮",
        [Currency.XRP]: "✘",
        [Currency.LTC]: "Ł"
    };
    
    // Determine decimal places based on currency type
    let decimalPlaces = 2;
    if (currency === Currency.BTC || currency === Currency.ETH || 
        currency === Currency.XRP || currency === Currency.LTC) {
        decimalPlaces = 8;
    } else if (currency === Currency.JPY || currency === Currency.KRW || 
               currency === Currency.IDR || currency === Currency.CLP || 
               currency === Currency.COP) {
        decimalPlaces = 0;
    }
    
    // Get the symbol for the currency, default to $ if not found
    const symbol = symbols[currency] || "$";
    
    return `${symbol}${amount.toFixed(decimalPlaces)}`;
}
