export enum RuleModeEnum {
  UNDER_THRESHOLD = 'UNDER_THRESHOLD',
  FORCED_LOSS = 'FORCED_LOSS',
}

export interface ExchangeRateData {
  currencyCode: string;
  ratePerUsd: number;
  lastUpdated: Date;
}

export interface BalanceEvaluationResult {
  balance: string;
  currencyCode: string;
  exchangeRate: string;
  usdThreshold: string;
  localThreshold: string;
  balanceInUsd: string;
  ruleMode: RuleModeEnum;
  winProbability: number;
  lossProbability: number;
}

export interface GameRuleContext {
  userId: string;
  balance: string;
  currencyCode: string;
  betAmount: string;
  gameType: string;
  evaluation: BalanceEvaluationResult;
}

export interface GameRuleResult {
  isWin: boolean;
  ruleMode: RuleModeEnum;
  winProbability: number;
  context: GameRuleContext;
}
