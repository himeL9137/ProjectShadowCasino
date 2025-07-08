import axios from 'axios';
import { Currency } from '@shared/schema';

interface ExchangeRates {
  [key: string]: number;
}

class EnhancedCurrencyConverter {
  private static instance: EnhancedCurrencyConverter;
  private rates: ExchangeRates = {};
  private lastUpdate: Date = new Date(0);
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly FALLBACK_RATES: ExchangeRates = {
    // Main currencies - Updated with accurate rates
    USD: 1.0,
    BDT: 110.0,
    INR: 83.0,
    BTC: 0.0000092563, // 1/108005
    JPY: 146.0,

    // Additional major currencies
    EUR: 0.9,
    GBP: 0.75,
    CAD: 1.35,
    AUD: 1.5,
    CNY: 7.2,

    // European currencies
    CHF: 0.95,
    SEK: 10.5,
    NOK: 10.8,
    DKK: 7.4,
    PLN: 4.3,

    // Asian currencies
    HKD: 7.8,
    SGD: 1.38,
    THB: 35.0,
    KRW: 1300.0,
    IDR: 15000.0,

    // Middle Eastern currencies
    AED: 3.67,
    SAR: 3.75,
    TRY: 28.0,
    ILS: 3.5,
    QAR: 3.64,

    // Americas currencies
    MXN: 17.0,
    BRL: 5.2,
    ARS: 300.0,
    CLP: 800.0,
    COP: 4000.0,

    // African currencies
    ZAR: 18.0,
    NGN: 750.0,
    EGP: 30.0,
    KES: 120.0,
    GHS: 11.0,

    // Cryptocurrencies - Converting from USD value to rate
    ETH: 0.000393, // 1/2541.91
    USDT: 0.999971,
    XRP: 0.442, // 1/2.26
    LTC: 0.0116 // 1/86.01
  };

  private constructor() {}

  static getInstance(): EnhancedCurrencyConverter {
    if (!EnhancedCurrencyConverter.instance) {
      EnhancedCurrencyConverter.instance = new EnhancedCurrencyConverter();
    }
    return EnhancedCurrencyConverter.instance;
  }

  async updateRates() {
    try {
      // Update rates
      const rates = await this.tryMultipleExchangeAPIs();
      if (!rates || Object.keys(rates).length === 0) {
        throw new Error('Empty rates received');
      }
      this.rates = { ...this.FALLBACK_RATES };
      // Update with fetched rates if available
        Object.entries(rates).forEach(([currency, rate]) => {
          if (rate) {
            this.rates[currency] = rate;
          }
        });
      this.lastUpdate = new Date();
      console.log('Exchange rates updated successfully:', Object.keys(this.rates).length, 'currencies');
    } catch (error) {
      console.error('Exchange rate update failed:', error.message);
      // Use default rates if update fails
      this.useDefaultRates();
      console.log('Using default exchange rates as fallback');
    }
  }

  private getDefaultRates() {
    return {
      USD: 1,
      BDT: 121.85,
      INR: 86,
      BTC: 0.000009112,
      JPY: 145,
      EUR: 0.93,
      GBP: 0.79
    };
  }

  private async tryMultipleExchangeAPIs(): Promise<ExchangeRates | null> {
    // Try multiple exchange rate APIs in sequence until one works
    const apis = [
      this.tryExchangeRateAPI,
      this.tryExchangeRateHostAPI,
      this.tryOpenExchangeRatesAPI
    ];

    for (const apiMethod of apis) {
      try {
        const rates = await apiMethod.call(this);
        if (rates && rates.BDT && rates.INR) {
          // If we got fiat rates, try to get BTC rate separately
          const btcRate = await this.tryMultipleBTCAPIs();
          if (btcRate) {
            rates.BTC = btcRate;
          } else {
            rates.BTC = this.FALLBACK_RATES.BTC;
          }
          return rates;
        }
      } catch (err: any) {
        console.log(`API attempt failed, trying next one: ${err?.message || 'Unknown error'}`);
        continue;
      }
    }

    // All attempts failed
    return null;
  }

  private async tryExchangeRateAPI(): Promise<ExchangeRates | null> {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: 3000
    });

    if (response.data?.rates) {
      return {
        USD: 1.0,
        BDT: response.data.rates.BDT,
        INR: response.data.rates.INR
      };
    }
    return null;
  }

  private async tryExchangeRateHostAPI(): Promise<ExchangeRates | null> {
    const response = await axios.get('https://api.exchangerate.host/latest', {
      params: {
        base: 'USD',
        symbols: 'BDT,INR,JPY'
      },
      timeout: 3000
    });

    if (response.data?.rates) {
      return {
        USD: 1.0,
        BDT: response.data.rates.BDT,
        INR: response.data.rates.INR,
        JPY: response.data.rates.JPY
      };
    }
    return null;
  }

  private async tryOpenExchangeRatesAPI(): Promise<ExchangeRates | null> {
    // Fallback to a third API
    const response = await axios.get('https://open.er-api.com/v6/latest/USD', {
      timeout: 3000
    });

    if (response.data?.rates) {
      return {
        USD: 1.0,
        BDT: response.data.rates.BDT,
        INR: response.data.rates.INR,
        JPY: response.data.rates.JPY
      };
    }
    return null;
  }

  private async tryMultipleBTCAPIs(): Promise<number | null> {
    // Try multiple BTC price APIs
    try {
      // CoinGecko
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'bitcoin',
          vs_currencies: 'usd'
        },
        timeout: 3000
      });

      if (response.data?.bitcoin?.usd) {
        return 1 / response.data.bitcoin.usd;
      }
    } catch (err: any) {
      console.log(`CoinGecko BTC API failed, trying alternative: ${err?.message || 'Unknown error'}`);
    }

    try {
      // Alternative BTC API
      const response = await axios.get('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
        timeout: 3000
      });

      if (response.data?.data?.amount) {
        return 1 / parseFloat(response.data.data.amount);
      }
    } catch (err) {
      console.log('Coinbase BTC API failed');
    }

    return null;
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

  isValidCurrency(currency: string): boolean {
    return Object.values(Currency).includes(currency as Currency);
  }

  async convert(amount: number, fromCurrency: Currency, toCurrency: Currency): Promise<number> {
    if (!this.isValidCurrency(fromCurrency) || !this.isValidCurrency(toCurrency)) {
      throw new Error(`Invalid currency: ${fromCurrency} or ${toCurrency}`);
    }

    if (fromCurrency === toCurrency) return amount;

    const rates = await this.getRates();

    // Convert through USD as base currency
    const amountInUSD = amount / rates[fromCurrency];
    const convertedAmount = amountInUSD * rates[toCurrency];

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
      throw new Error(`Invalid currency pair: ${fromCurrency}/${toCurrency}`);
    }
    return rates[toCurrency] / rates[fromCurrency];
  }

  getSupportedCurrencies(): string[] {
    return Object.keys(this.rates);
  }
}

export const enhancedCurrencyConverter = EnhancedCurrencyConverter.getInstance();

/**
 * Start periodic updates of exchange rates
 * @param intervalMinutes How often to update rates in minutes
 */
export function startExchangeRateUpdates(intervalMinutes: number = 30): () => void {
    console.log(`Starting exchange rate updates every ${intervalMinutes} minutes`);

    // Initial update
    enhancedCurrencyConverter.updateRates()
        .then(() => {
            console.log('Initial exchange rate update completed successfully');
        })
        .catch(error => {
            console.error('Initial exchange rate update error:', error.message || error);
        });

    // Schedule periodic updates
    const intervalId = setInterval(() => {
        enhancedCurrencyConverter.updateRates()
            .then(() => {
                const currencyCount = enhancedCurrencyConverter.getSupportedCurrencies().length;
                console.log(`Periodic exchange rate update completed: ${currencyCount} currencies available`);
            })
            .catch(error => {
                console.error('Periodic exchange rate update error:', error.message || error);
            });
    }, intervalMinutes * 60 * 1000);

    // Return cleanup function
    return () => {
        clearInterval(intervalId);
        console.log('Exchange rate updates stopped');
    };
}