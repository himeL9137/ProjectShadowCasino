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
    // Main currencies
    USD: 1.0,
    BDT: 122.73,
    INR: 83.27,
    BTC: 0.000013,
    JPY: 145.00,

    // Additional major currencies
    EUR: 0.93,
    GBP: 0.79,
    CAD: 1.36,
    AUD: 1.52,
    CNY: 7.25,

    // European currencies
    CHF: 0.91,
    SEK: 10.55,
    NOK: 10.80,
    DKK: 6.95,
    PLN: 4.08,

    // Asian currencies
    HKD: 7.82,
    SGD: 1.36,
    THB: 35.75,
    KRW: 1370.45,
    IDR: 15900.00,

    // Middle Eastern currencies
    AED: 3.67,
    SAR: 3.75,
    TRY: 32.40,
    ILS: 3.67,
    QAR: 3.64,

    // Americas currencies
    MXN: 16.82,
    BRL: 5.08,
    ARS: 900.00,
    CLP: 928.45,
    COP: 3950.00,

    // African currencies
    ZAR: 18.50,
    NGN: 1545.00,
    EGP: 48.20,
    KES: 130.25,
    GHS: 15.30,

    // Other cryptocurrencies
    ETH: 0.000167,
    USDT: 1.00,
    XRP: 0.52,
    LTC: 0.0088
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
        .then(success => {
            console.log(`Initial exchange rate update ${success ? 'successful' : 'failed'}`);
        })
        .catch(error => {
            console.error('Initial exchange rate update failed:', error);
        });

    // Schedule periodic updates
    const intervalId = setInterval(() => {
        enhancedCurrencyConverter.updateRates()
            .then(success => {
                console.log(`Exchange rates updated successfully: ${enhancedCurrencyConverter.getSupportedCurrencies().length} currencies`);
            })
            .catch(error => {
                console.error('Error during periodic exchange rate update:', error);
            });
    }, intervalMinutes * 60 * 1000);

    // Return cleanup function
    return () => {
        clearInterval(intervalId);
        console.log('Exchange rate updates stopped');
    };
}