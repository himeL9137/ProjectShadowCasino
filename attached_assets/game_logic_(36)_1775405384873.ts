import { ProbabilityRuleDto } from './probability-rule.dto';

export class GameRoundResponseDto {
  playerId: string;
  gameType: string;
  currencyCode: string;
  balance: string;
  exchangeRate: string;
  usdThreshold: string;
  localThreshold: string;
  balanceInUsd: string;
  ruleMode: string;
  probabilityRule: ProbabilityRuleDto;
  result: string;
  payoutDelta: string;
  updatedBalance: string;
  presentation: Record<string, unknown>;
}