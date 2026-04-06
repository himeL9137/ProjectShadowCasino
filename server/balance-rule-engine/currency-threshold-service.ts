import { ExchangeRateService } from './exchange-rate-service.js';
import { DecimalUtils } from './decimal-utils.js';

export class CurrencyThresholdService {
  private usdThreshold: string = '150';
  private exchangeRateService: ExchangeRateService;

  constructor(exchangeRateService: ExchangeRateService) {
    this.exchangeRateService = exchangeRateService;
  }

  getUsdThreshold(): string {
    return this.usdThreshold;
  }

  setUsdThreshold(threshold: string | number): void {
    this.usdThreshold = DecimalUtils.toDecimal(threshold);
  }

  getLocalThreshold(currencyCode: string): string {
    const rate = this.exchangeRateService.getRate(currencyCode);
    return DecimalUtils.multiply(this.usdThreshold, rate);
  }

  getBalanceInUsd(balance: string | number, currencyCode: string): string {
    const rate = this.exchangeRateService.getRate(currencyCode);
    return DecimalUtils.divide(balance, rate);
  }

  convertBalance(fromBalance: string | number, fromCurrency: string, toCurrency: string): string {
    if (fromCurrency === toCurrency) {
      return DecimalUtils.toDecimal(fromBalance);
    }

    const balanceInUsd = this.getBalanceInUsd(fromBalance, fromCurrency);
    const toRate = this.exchangeRateService.getRate(toCurrency);
    return DecimalUtils.multiply(balanceInUsd, toRate);
  }
}
