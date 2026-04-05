import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Decimal from 'decimal.js';
import { CurrencyThresholdService } from './currency-threshold.service';
import { RuleModeEnum } from '../common/enums/rule-mode.enum';
import { ThresholdEvaluationResponseDto } from './dto/threshold-evaluation-response.dto';

@Injectable()
export class BalanceRuleEvaluator {
  private winProbUnder: number;
  private lossProbUnder: number;

  constructor(
    private currencyThreshold: CurrencyThresholdService,
    private configService: ConfigService,
  ) {
    this.winProbUnder = this.configService.get<number>('underThresholdWinProbability');
    this.lossProbUnder = this.configService.get<number>('underThresholdLossProbability');
  }

  evaluate(balance: Decimal, currencyCode: string): ThresholdEvaluationResponseDto {
    const exchangeRate = this.currencyThreshold['exchangeRateService'].getRate(currencyCode);
    const localThreshold = this.currencyThreshold.getLocalThreshold(currencyCode);
    const balanceInUsd = this.currencyThreshold.getBalanceInUsd(balance, currencyCode);
    const usdThreshold = this.currencyThreshold.getUsdThreshold();

    const ruleMode = balance.greaterThanOrEqualTo(localThreshold)
      ? RuleModeEnum.FORCED_LOSS
      : RuleModeEnum.UNDER_THRESHOLD;

    let winProbability: number;
    let lossProbability: number;

    if (ruleMode === RuleModeEnum.UNDER_THRESHOLD) {
      winProbability = this.winProbUnder;
      lossProbability = this.lossProbUnder;
    } else {
      winProbability = 0;
      lossProbability = 1;
    }

    return {
      balance,
      currencyCode,
      exchangeRate,
      usdThreshold,
      localThreshold,
      balanceInUsd,
      ruleMode,
      winProbability,
      lossProbability,
    };
  }
}