import { Module } from '@nestjs/common';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { CurrencyThresholdService } from './currency-threshold.service';
import { BalanceRuleEvaluator } from './balance-rule-evaluator.service';

@Module({
  imports: [ExchangeRateModule],
  providers: [CurrencyThresholdService, BalanceRuleEvaluator],
  exports: [CurrencyThresholdService, BalanceRuleEvaluator],
})
export class CurrencyModule {}