import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateService } from '../../exchange-rate/exchange-rate.service';
import { StaticExchangeRateProvider } from '../../exchange-rate/providers/static-exchange-rate.provider';
import { UnsupportedCurrencyException } from '../../common/exceptions/unsupported-currency.exception';

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExchangeRateService, StaticExchangeRateProvider],
    }).compile();
    service = module.get<ExchangeRateService>(ExchangeRateService);
  });

  it('should return rate for USD', () => {
    expect(service.getRate('USD').toString()).toBe('1');
  });

  it('should throw for unsupported currency', () => {
    expect(() => service.getRate('XYZ')).toThrow(UnsupportedCurrencyException);
  });
});