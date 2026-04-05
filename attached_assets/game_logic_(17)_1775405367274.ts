import { Injectable } from '@nestjs/common';
import { GameResultEnum } from '../../common/enums/game-result.enum';

@Injectable()
export class DiceRollPresenter {
  build(result: GameResultEnum): Record<string, unknown> {
    let playerRoll: number;
    let systemRoll: number;

    do {
      playerRoll = Math.floor(Math.random() * 6) + 1;
      systemRoll = Math.floor(Math.random() * 6) + 1;
    } while (playerRoll === systemRoll);

    if (result === GameResultEnum.WIN && playerRoll < systemRoll) {
      [playerRoll, systemRoll] = [systemRoll, playerRoll];
    } else if (result === GameResultEnum.LOSE && playerRoll > systemRoll) {
      [playerRoll, systemRoll] = [systemRoll, playerRoll];
    }

    return { playerRoll, systemRoll };
  }
}