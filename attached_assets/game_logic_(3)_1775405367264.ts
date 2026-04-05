import { IsEnum, IsNotEmpty, IsString, IsOptional, Matches, IsIn } from 'class-validator';
import { GameTypeEnum } from '../../common/enums/game-type.enum';
import { CurrencyCodeEnum } from '../../common/enums/currency-code.enum';

export class PlayGameDto {
  @IsNotEmpty()
  @IsString()
  playerId: string;

  @IsEnum(GameTypeEnum)
  gameType: GameTypeEnum;

  @IsEnum(CurrencyCodeEnum)
  currencyCode: CurrencyCodeEnum;

  @Matches(/^\d+(\.\d+)?$/, { message: 'balance must be a decimal string' })
  balance: string;

  @Matches(/^\d+(\.\d+)?$/, { message: 'wagerAmount must be a decimal string' })
  wagerAmount: string;

  @IsOptional()
  @IsIn(['HEADS', 'TAILS'])
  playerChoice?: 'HEADS' | 'TAILS';
}