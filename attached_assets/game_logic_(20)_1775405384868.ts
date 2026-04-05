import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CurrencyThresholdService } from '../../currency/currency-threshold.service';
import { ExchangeRateService } from '../../exchange-rate/exchange-rate.service';
import { toDecimal } from '../../common/utils/decimal.util';

describe('CurrencyThresholdService', () => {
  let service: CurrencyThresholdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyThresholdService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(150) },
        },
        {
          provide: ExchangeRateService,
          useValue: { getRate: jest.fn().mockReturnValue(toDecimal('122.4267')) },
        },
      ],
    }).compile();
    service = module.get<CurrencyThresholdService>(CurrencyThresholdService);
  });

  it('should compute local threshold for BDT', () => {
    const threshold = service.getLocalThreshold('BDT');
    expect(threshold.toString()).toBe('18364.005');
  });

  it('should convert balance to USD', () => {
    const usd = service.getBalanceInUsd(toDecimal('18000'), 'BDT');
    expect(usd.toString()).toBe('147.0272');
  });
});