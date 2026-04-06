import { GameOutcomeEngine } from './game-outcome-engine.js';
import { BalanceRuleEvaluator } from './balance-rule-evaluator.js';
import { RandomizationService, GameResultEnum } from './randomization-service.js';
import { exchangeRateService } from './exchange-rate-service.js';
import { RuleModeEnum, GameRuleResult, BalanceEvaluationResult } from './types.js';

export interface GameRuleOutcome {
  isWin: boolean;
  ruleMode: RuleModeEnum;
  balanceEvaluation: BalanceEvaluationResult;
  canWin: boolean;
}

export class GameIntegration {
  private gameOutcomeEngine: GameOutcomeEngine;
  private balanceRuleEvaluator: BalanceRuleEvaluator;

  constructor() {
    const currencyThresholdService = require('./index.js').currencyThresholdService;
    this.balanceRuleEvaluator = require('./index.js').balanceRuleEvaluator;
    this.gameOutcomeEngine = require('./index.js').gameOutcomeEngine;
  }

  evaluateGameRound(
    userId: string,
    balance: string | number,
    currencyCode: string,
    betAmount: string | number,
    gameType: string,
  ): GameRuleOutcome {
    try {
      const ruleResult = this.gameOutcomeEngine.evaluateRound(
        userId,
        balance,
        currencyCode,
        betAmount,
        gameType,
      );

      return {
        isWin: ruleResult.isWin,
        ruleMode: ruleResult.ruleMode,
        balanceEvaluation: ruleResult.context.evaluation,
        canWin: ruleResult.ruleMode === RuleModeEnum.UNDER_THRESHOLD,
      };
    } catch (error) {
      console.error('Game rule evaluation error:', error);
      throw error;
    }
  }

  getThresholdInfo(currencyCode: string): {
    usdThreshold: string;
    localThreshold: string;
    exchangeRate: string;
    currencyCode: string;
  } {
    const info = this.gameOutcomeEngine.getThresholdInfo(currencyCode);
    return {
      ...info,
      currencyCode,
    };
  }

  canPlayerWin(balance: string | number, currencyCode: string): boolean {
    try {
      const evaluation = this.balanceRuleEvaluator.evaluate(balance, currencyCode);
      return evaluation.ruleMode === RuleModeEnum.UNDER_THRESHOLD;
    } catch {
      return false;
    }
  }

  getBalanceEvaluation(balance: string | number, currencyCode: string): BalanceEvaluationResult {
    return this.balanceRuleEvaluator.evaluate(balance, currencyCode);
  }

  getSupportedCurrencies(): string[] {
    return exchangeRateService.getAllSupportedCurrencies();
  }
}

export const gameIntegration = new GameIntegration();
