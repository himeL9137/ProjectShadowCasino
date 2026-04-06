import { RuleModeEnum, BalanceEvaluationResult } from './types.js';
import { CurrencyThresholdService } from './currency-threshold-service.js';
import { DecimalUtils } from './decimal-utils.js';

export class BalanceRuleEvaluator {
  private currencyThresholdService: CurrencyThresholdService;
  private underThresholdWinProb: number = 0.5;
  private underThresholdLossProb: number = 0.5;

  constructor(currencyThresholdService: CurrencyThresholdService) {
    this.currencyThresholdService = currencyThresholdService;
  }

  evaluate(balance: string | number, currencyCode: string): BalanceEvaluationResult {
    const balanceStr = DecimalUtils.toDecimal(balance);
    const exchangeRate = this.currencyThresholdService['exchangeRateService'].getRate(currencyCode);
    const localThreshold = this.currencyThresholdService.getLocalThreshold(currencyCode);
    const balanceInUsd = this.currencyThresholdService.getBalanceInUsd(balance, currencyCode);
    const usdThreshold = this.currencyThresholdService.getUsdThreshold();

    const ruleMode = DecimalUtils.greaterThanOrEqualTo(balanceStr, localThreshold)
      ? RuleModeEnum.FORCED_LOSS
      : RuleModeEnum.UNDER_THRESHOLD;

    let winProbability: number;
    let lossProbability: number;

    if (ruleMode === RuleModeEnum.UNDER_THRESHOLD) {
      winProbability = this.underThresholdWinProb;
      lossProbability = this.underThresholdLossProb;
    } else {
      winProbability = 0;
      lossProbability = 1;
    }

    return {
      balance: balanceStr,
      currencyCode,
      exchangeRate: exchangeRate.toString(),
      usdThreshold,
      localThreshold,
      balanceInUsd,
      ruleMode,
      winProbability,
      lossProbability,
    };
  }

  setUnderThresholdProbabilities(winProb: number, lossProb: number): void {
    if (winProb + lossProb !== 1) {
      throw new Error('Win and loss probabilities must sum to 1');
    }
    this.underThresholdWinProb = winProb;
    this.underThresholdLossProb = lossProb;
  }
}
