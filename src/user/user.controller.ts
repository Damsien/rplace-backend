import { Controller, Get, HttpCode, Request, UseGuards } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { GameService } from 'src/game/game.service';
import { GameGuard } from 'src/game/guard/game.guard';

@UseGuards(GameGuard)
@UseGuards(AtAuthGuard)
@Controller('user')
export class UserController {

    constructor(private readonly gameService: GameService) {}

    @HttpCode(200)
    @Get('game')
    getUserGameSpec(@Request() req) {
        return this.gameService.getUserGame(req.user);
    }
    
    @HttpCode(200)
    @Get('game-all')
    getAllGame() {
        return this.gameService.getGlobalGame();
    }

}
