import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { StaticExchangeRateProvider } from './providers/static-exchange-rate.provider';

@Module({
  providers: [ExchangeRateService, StaticExchangeRateProvider],
  exports: [ExchangeRateService],
})
export class ExchangeRateModule {}