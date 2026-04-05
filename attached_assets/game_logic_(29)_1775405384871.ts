import Decimal from 'decimal.js';

export interface ExchangeRateProvider {
  getRate(currencyCode: string): Decimal;
}