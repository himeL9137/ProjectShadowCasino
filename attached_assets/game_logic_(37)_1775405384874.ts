import { DiceRollPresenter } from '../../game/presenters/dice-roll.presenter';
import { GameResultEnum } from '../../common/enums/game-result.enum';

describe('DiceRollPresenter', () => {
  let presenter: DiceRollPresenter;

  beforeEach(() => {
    presenter = new DiceRollPresenter();
  });

  it('should ensure playerRoll > systemRoll on WIN', () => {
    for (let i = 0; i < 50; i++) {
      const res = presenter.build(GameResultEnum.WIN);
      expect(res.playerRoll).toBeGreaterThan(res.systemRoll);
    }
  });

  it('should ensure playerRoll < systemRoll on LOSE', () => {
    for (let i = 0; i < 50; i++) {
      const res = presenter.build(GameResultEnum.LOSE);
      expect(res.playerRoll).toBeLessThan(res.systemRoll);
    }
  });
});