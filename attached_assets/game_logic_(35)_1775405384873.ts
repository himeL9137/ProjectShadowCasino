import { Injectable } from '@nestjs/common';
import { GameResultEnum } from '../../common/enums/game-result.enum';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

@Injectable()
export class CardDrawPresenter {
  build(result: GameResultEnum): Record<string, unknown> {
    let playerIdx: number;
    let systemIdx: number;

    do {
      playerIdx = Math.floor(Math.random() * 13);
      systemIdx = Math.floor(Math.random() * 13);
    } while (playerIdx === systemIdx);

    if (result === GameResultEnum.WIN && playerIdx < systemIdx) {
      [playerIdx, systemIdx] = [systemIdx, playerIdx];
    } else if (result === GameResultEnum.LOSE && playerIdx > systemIdx) {
      [playerIdx, systemIdx] = [systemIdx, playerIdx];
    }

    return {
      playerCard: RANKS[playerIdx],
      systemCard: RANKS[systemIdx],
    };
  }
}