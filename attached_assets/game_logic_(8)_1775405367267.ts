import { BadRequestException } from '@nestjs/common';

export class UnsupportedCurrencyException extends BadRequestException {
  constructor(currency: string) {
    super(`Unsupported currency code: ${currency}`);
  }
}