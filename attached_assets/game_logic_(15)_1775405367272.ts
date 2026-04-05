import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Decimal from 'decimal.js';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { toDecimal } from '../common/utils/decimal.util';

@Injectable()
export class CurrencyThresholdService {
  private usdThreshold: Decimal;

  constructor(
    private configService: ConfigService,
    private exchangeRateService: ExchangeRateService,
  ) {
    this.usdThreshold = toDecimal(this.configService.get<number>('usdThreshold'));
  }

  getUsdThreshold(): Decimal {
    return this.usdThreshold;
  }

  getLocalThreshold(currencyCode: string): Decimal {
    const rate = this.exchangeRateService.getRate(currencyCode);
    return this.usdThreshold.mul(rate);
  }

  getBalanceInUsd(balance: Decimal, currencyCode: string): Decimal {
    const rate = this.exchangeRateService.getRate(currencyCode);
    return balance.div(rate);
  }
}