import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PlayGameDto } from './dto/play-game.dto';
import { GameRoundResponseDto } from './dto/game-round-response.dto';
import { BalanceRuleEvaluator } from '../currency/balance-rule-evaluator.service';
import { RandomizationService } from './services/randomization.service';
import { CoinFlipPresenter } from './presenters/coin-flip.presenter';
import { DiceRollPresenter } from './presenters/dice-roll.presenter';
import { CardDrawPresenter } from './presenters/card-draw.presenter';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import { InsufficientBalanceException } from '../common/exceptions/insufficient-balance.exception';
import { InvalidGameInputException } from '../common/exceptions/invalid-game-input.exception';
import { GameResultEnum } from '../common/enums/game-result.enum';
import { toDecimal } from '../common/utils/decimal.util';

@Injectable()
export class GameOutcomeEngine {
  constructor(
    private balanceRuleEvaluator: BalanceRuleEvaluator,
    private randomService: RandomizationService,
    private coinFlipPresenter: CoinFlipPresenter,
    private diceRollPresenter: DiceRollPresenter,
    private cardDrawPresenter: CardDrawPresenter,
    private exchangeRateService: ExchangeRateService,
  ) {}

  async playRound(dto: PlayGameDto): Promise<GameRoundResponseDto> {
    const balance = toDecimal(dto.balance);
    const wager = toDecimal(dto.wagerAmount);

    if (balance.lessThan(wager)) {
      throw new InsufficientBalanceException();
    }

    if (dto.gameType === 'COIN_FLIP' && !dto.playerChoice) {
      throw new InvalidGameInputException('playerChoice is required for COIN_FLIP');
    }

    const evalResult = this.balanceRuleEvaluator.evaluate(balance, dto.currencyCode);

    let gameResult: GameResultEnum;
    if (evalResult.ruleMode === 'FORCED_LOSS') {
      gameResult = GameResultEnum.LOSE;
    } else {
      gameResult = this.randomService.resolveByProbability(evalResult.winProbability);
    }

    let presentation: Record<string, unknown>;
    switch (dto.gameType) {
      case 'COIN_FLIP':
        presentation = this.coinFlipPresenter.build(dto.playerChoice!, gameResult);
        break;
      case 'DICE_ROLL':
        presentation = this.diceRollPresenter.build(gameResult);
        break;
      case 'CARD_DRAW':
        presentation = this.cardDrawPresenter.build(gameResult);
        break;
      default:
        throw new InvalidGameInputException('Unsupported game type');
    }

    const delta = gameResult === GameResultEnum.WIN ? wager : wager.negated();
    const updatedBalance = balance.plus(delta);

    const exchangeRate = this.exchangeRateService.getRate(dto.currencyCode);

    return {
      playerId: dto.playerId,
      gameType: dto.gameType,
      currencyCode: dto.currencyCode,
      balance: balance.toString(),
      exchangeRate: exchangeRate.toString(),
      usdThreshold: evalResult.usdThreshold.toString(),
      localThreshold: evalResult.localThreshold.toString(),
      balanceInUsd: evalResult.balanceInUsd.toString(),
      ruleMode: evalResult.ruleMode,
      probabilityRule: {
        win: evalResult.winProbability,
        loss: evalResult.lossProbability,
      },
      result: gameResult,
      payoutDelta: delta.toString(),
      updatedBalance: updatedBalance.toString(),
      presentation,
    };
  }
}