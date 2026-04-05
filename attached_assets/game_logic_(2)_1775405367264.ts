import { Body, Controller, Post } from '@nestjs/common';
import { GameOutcomeEngine } from './game-outcome.engine';
import { PlayGameDto } from './dto/play-game.dto';
import { GameRoundResponseDto } from './dto/game-round-response.dto';

@Controller('games')
export class GameController {
  constructor(private readonly gameEngine: GameOutcomeEngine) {}

  @Post('play')
  async play(@Body() playGameDto: PlayGameDto): Promise<GameRoundResponseDto> {
    return this.gameEngine.playRound(playGameDto);
  }
}