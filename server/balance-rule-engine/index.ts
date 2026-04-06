export { ExchangeRateService, exchangeRateService } from './exchange-rate-service.js';
export { CurrencyThresholdService } from './currency-threshold-service.js';
export { BalanceRuleEvaluator } from './balance-rule-evaluator.js';
export { GameOutcomeEngine } from './game-outcome-engine.js';
export { RandomizationService, GameResultEnum, randomizationService } from './randomization-service.js';
export { DecimalUtils } from './decimal-utils.js';
export type {
  RuleModeEnum,
  ExchangeRateData,
  BalanceEvaluationResult,
  GameRuleContext,
  GameRuleResult,
} from './types.js';
export { RuleModeEnum } from './types.js';

import { ExchangeRateService, exchangeRateService } from './exchange-rate-service.js';
import { CurrencyThresholdService } from './currency-threshold-service.js';
import { BalanceRuleEvaluator } from './balance-rule-evaluator.js';
import { GameOutcomeEngine } from './game-outcome-engine.js';
import { randomizationService } from './randomization-service.js';

export const currencyThresholdService = new CurrencyThresholdService(exchangeRateService);
export const balanceRuleEvaluator = new BalanceRuleEvaluator(currencyThresholdService);
export const gameOutcomeEngine = new GameOutcomeEngine(balanceRuleEvaluator, randomizationService);
