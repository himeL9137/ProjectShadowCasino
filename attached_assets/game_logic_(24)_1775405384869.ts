import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BalanceRuleEvaluator } from '../../currency/balance-rule-evaluator.service';
import { CurrencyThresholdService } from '../../currency/currency-threshold.service';
import { toDecimal } from '../../common/utils/decimal.util';
import { RuleModeEnum } from '../../common/enums/rule-mode.enum';

describe('BalanceRuleEvaluator', () => {
  let evaluator: BalanceRuleEvaluator;
  let thresholdService: CurrencyThresholdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceRuleEvaluator,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'underThresholdWinProbability') return 0.5;
              if (key === 'underThresholdLossProbability') return 0.5;
              return null;
            }),
          },
        },
        {
          provide: CurrencyThresholdService,
          useValue: {
            getLocalThreshold: jest.fn().mockReturnValue(toDecimal('18364.005')),
            getBalanceInUsd: jest.fn().mockReturnValue(toDecimal('147.0272')),
            getUsdThreshold: jest.fn().mockReturnValue(toDecimal('150')),
            exchangeRateService: { getRate: jest.fn().mockReturnValue(toDecimal('122.4267')) },
          },
        },
      ],
    }).compile();
    evaluator = module.get<BalanceRuleEvaluator>(BalanceRuleEvaluator);
    thresholdService = module.get<CurrencyThresholdService>(CurrencyThresholdService);
  });

  it('should return UNDER_THRESHOLD when balance < localThreshold', () => {
    const res = evaluator.evaluate(toDecimal('18000'), 'BDT');
    expect(res.ruleMode).toBe(RuleModeEnum.UNDER_THRESHOLD);
    expect(res.winProbability).toBe(0.5);
  });

  it('should return FORCED_LOSS when balance == threshold', () => {
    (thresholdService.getLocalThreshold as jest.Mock).mockReturnValue(toDecimal('18364.005'));
    const res = evaluator.evaluate(toDecimal('18364.005'), 'BDT');
    expect(res.ruleMode).toBe(RuleModeEnum.FORCED_LOSS);
    expect(res.winProbability).toBe(0);
  });
});