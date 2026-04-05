import Decimal from 'decimal.js';
import { RuleModeEnum } from '../../common/enums/rule-mode.enum';

export class ThresholdEvaluationResponseDto {
  balance: Decimal;
  currencyCode: string;
  exchangeRate: Decimal;
  usdThreshold: Decimal;
  localThreshold: Decimal;
  balanceInUsd: Decimal;
  ruleMode: RuleModeEnum;
  winProbability: number;
  lossProbability: number;
}