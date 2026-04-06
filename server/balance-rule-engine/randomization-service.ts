export enum GameResultEnum {
  WIN = 'WIN',
  LOSE = 'LOSE',
}

export class RandomizationService {
  next(): number {
    return Math.random();
  }

  resolveByProbability(winProbability: number): GameResultEnum {
    if (winProbability < 0 || winProbability > 1) {
      throw new Error('Win probability must be between 0 and 1');
    }
    return this.next() < winProbability ? GameResultEnum.WIN : GameResultEnum.LOSE;
  }

  forceResult(result: GameResultEnum): GameResultEnum {
    return result;
  }
}

export const randomizationService = new RandomizationService();
