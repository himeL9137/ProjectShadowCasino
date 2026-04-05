import { Injectable } from '@nestjs/common';
import { GameResultEnum } from '../../common/enums/game-result.enum';

@Injectable()
export class CoinFlipPresenter {
  build(playerChoice: 'HEADS' | 'TAILS', result: GameResultEnum): Record<string, unknown> {
    const coinResult = result === GameResultEnum.WIN ? playerChoice : (playerChoice === 'HEADS' ? 'TAILS' : 'HEADS');
    return { playerChoice, coinResult };
  }
}