import { ExchangeRateData } from './types.js';

const STATIC_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  BDT: 122.4267,
  EUR: 0.92,
  INR: 83.5,
  PKR: 278.1,
  GBP: 0.79,
  JPY: 151.2,
  AED: 3.6725,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.88,
  SEK: 10.5,
  NOK: 10.8,
  DKK: 6.85,
  PLN: 4.2,
  HKD: 7.78,
  SGD: 1.35,
  THB: 35.5,
  KRW: 1300,
  IDR: 16000,
  MXN: 20.5,
  BRL: 5.2,
  ZAR: 18.5,
  ILS: 3.7,
  CNY: 7.2,
};

export class ExchangeRateService {
  private rateCache: Map<string, ExchangeRateData> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000;

  getRate(currencyCode: string): number {
    const cached = this.rateCache.get(currencyCode);
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheExpiry) {
      return cached.ratePerUsd;
    }

    if (!STATIC_EXCHANGE_RATES[currencyCode]) {
      throw new Error(`Unsupported currency code: ${currencyCode}`);
    }

    const rate = STATIC_EXCHANGE_RATES[currencyCode];
    this.rateCache.set(currencyCode, {
      currencyCode,
      ratePerUsd: rate,
      lastUpdated: new Date(),
    });

    return rate;
  }

  isSupportedCurrency(currencyCode: string): boolean {
    return currencyCode in STATIC_EXCHANGE_RATES;
  }

  getAllSupportedCurrencies(): string[] {
    return Object.keys(STATIC_EXCHANGE_RATES);
  }

  updateRate(currencyCode: string, rate: number): void {
    this.rateCache.set(currencyCode, {
      currencyCode,
      ratePerUsd: rate,
      lastUpdated: new Date(),
    });
  }
}

export const exchangeRateService = new ExchangeRateService();
