import { CoinFlipPresenter } from '../../game/presenters/coin-flip.presenter';
import { GameResultEnum } from '../../common/enums/game-result.enum';

describe('CoinFlipPresenter', () => {
  let presenter: CoinFlipPresenter;

  beforeEach(() => {
    presenter = new CoinFlipPresenter();
  });

  it('should return matching coin on WIN', () => {
    const result = presenter.build('HEADS', GameResultEnum.WIN);
    expect(result.coinResult).toBe('HEADS');
  });

  it('should return opposite on LOSE', () => {
    const result = presenter.build('HEADS', GameResultEnum.LOSE);
    expect(result.coinResult).toBe('TAILS');
  });
});