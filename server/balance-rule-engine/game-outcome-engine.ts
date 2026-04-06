import { BalanceRuleEvaluator } from './balance-rule-evaluator.js';
import { RandomizationService, GameResultEnum } from './randomization-service.js';
import { RuleModeEnum, GameRuleContext, GameRuleResult } from './types.js';
import { DecimalUtils } from './decimal-utils.js';

export class GameOutcomeEngine {
  private balanceRuleEvaluator: BalanceRuleEvaluator;
  private randomizationService: RandomizationService;

  constructor(
    balanceRuleEvaluator: BalanceRuleEvaluator,
    randomizationService: RandomizationService,
  ) {
    this.balanceRuleEvaluator = balanceRuleEvaluator;
    this.randomizationService = randomizationService;
  }

  evaluateRound(
    userId: string,
    balance: string | number,
    currencyCode: string,
    betAmount: string | number,
    gameType: string,
  ): GameRuleResult {
    const balanceStr = DecimalUtils.toDecimal(balance);
    const betStr = DecimalUtils.toDecimal(betAmount);

    if (DecimalUtils.lessThan(balanceStr, betStr)) {
      throw new Error('Insufficient balance for the bet amount');
    }

    const evaluation = this.balanceRuleEvaluator.evaluate(balance, currencyCode);

    let isWin: boolean;
    if (evaluation.ruleMode === RuleModeEnum.FORCED_LOSS) {
      isWin = false;
    } else {
      const result = this.randomizationService.resolveByProbability(evaluation.winProbability);
      isWin = result === GameResultEnum.WIN;
    }

    const context: GameRuleContext = {
      userId,
      balance: balanceStr,
      currencyCode,
      betAmount: betStr,
      gameType,
      evaluation,
    };

    return {
      isWin,
      ruleMode: evaluation.ruleMode,
      winProbability: evaluation.winProbability,
      context,
    };
  }

  getThresholdInfo(currencyCode: string): {
    usdThreshold: string;
    localThreshold: string;
    exchangeRate: string;
  } {
    const evaluation = this.balanceRuleEvaluator.evaluate('0', currencyCode);
    return {
      usdThreshold: evaluation.usdThreshold,
      localThreshold: evaluation.localThreshold,
      exchangeRate: evaluation.exchangeRate,
    };
  }
}
