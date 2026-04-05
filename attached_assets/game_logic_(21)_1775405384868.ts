import { Injectable } from '@nestjs/common';
import { GameResultEnum } from '../../common/enums/game-result.enum';

@Injectable()
export class RandomizationService {
  next(): number {
    return Math.random();
  }

  resolveByProbability(winProbability: number): GameResultEnum {
    return this.next() < winProbability ? GameResultEnum.WIN : GameResultEnum.LOSE;
  }
}