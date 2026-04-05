import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameOutcomeEngine } from './game-outcome.engine';
import { CurrencyModule } from '../currency/currency.module';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { RandomizationService } from './services/randomization.service';
import { CoinFlipPresenter } from './presenters/coin-flip.presenter';
import { DiceRollPresenter } from './presenters/dice-roll.presenter';
import { CardDrawPresenter } from './presenters/card-draw.presenter';

@Module({
  imports: [CurrencyModule, ExchangeRateModule],
  controllers: [GameController],
  providers: [
    GameOutcomeEngine,
    RandomizationService,
    CoinFlipPresenter,
    DiceRollPresenter,
    CardDrawPresenter,
  ],
})
export class GameModule {}