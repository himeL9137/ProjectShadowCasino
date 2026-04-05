import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ExchangeRateProvider } from './exchange-rate-provider.interface';

@Injectable()
export class StaticExchangeRateProvider implements ExchangeRateProvider {
  private rates: Record<string, string> = {
    USD: '1',
    BDT: '122.4267',
    EUR: '0.92',
    INR: '83.5',
    PKR: '278.1',
    GBP: '0.79',
    JPY: '151.2',
    AED: '3.6725',
    CAD: '1.36',
    AUD: '1.52',
  };

  getRate(currencyCode: string): Decimal {
    const rate = this.rates[currencyCode];
    if (!rate) {
      throw new Error(`Rate not found for ${currencyCode}`);
    }
    return new Decimal(rate);
  }
}