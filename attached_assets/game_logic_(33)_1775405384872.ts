import { BadRequestException } from '@nestjs/common';

export class ExchangeRateNotFoundException extends BadRequestException {
  constructor(currency: string) {
    super(`Exchange rate not found for currency: ${currency}`);
  }
}