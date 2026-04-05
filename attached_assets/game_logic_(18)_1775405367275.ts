import Decimal from 'decimal.js';

export class ThresholdEvaluationDto {
  balance: Decimal;
  currencyCode: string;
}