import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ExchangeRateProvider } from './providers/exchange-rate-provider.interface';
import { StaticExchangeRateProvider } from './providers/static-exchange-rate.provider';
import { UnsupportedCurrencyException } from '../common/exceptions/unsupported-currency.exception';
import { ExchangeRateNotFoundException } from '../common/exceptions/exchange-rate-not-found.exception';

@Injectable()
export class ExchangeRateService {
  private provider: ExchangeRateProvider;

  constructor(staticProvider: StaticExchangeRateProvider) {
    this.provider = staticProvider;
  }

  getRate(currencyCode: string): Decimal {
    try {
      return this.provider.getRate(currencyCode);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new ExchangeRateNotFoundException(currencyCode);
      }
      throw new UnsupportedCurrencyException(currencyCode);
    }
  }

  isSupportedCurrency(currencyCode: string): boolean {
    try {
      this.getRate(currencyCode);
      return true;
    } catch {
      return false;
    }
  }
}