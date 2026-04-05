import { BadRequestException } from '@nestjs/common';

export class InvalidGameInputException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}