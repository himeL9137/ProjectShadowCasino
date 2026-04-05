import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { CurrencyModule } from './currency/currency.module';
import { GameModule } from './game/game.module';
import gameConfig from './config/game.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [gameConfig],
    }),
    ExchangeRateModule,
    CurrencyModule,
    GameModule,
  ],
})
export class AppModule {}