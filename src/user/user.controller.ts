import { Controller, Get, HttpCode, Request, UseGuards } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { GameService } from 'src/game/game.service';

@Controller('user')
export class UserController {

    constructor(private readonly gameService: GameService) {}

    @UseGuards(AtAuthGuard)
    @HttpCode(200)
    @Get()
    getUserGameSpec(@Request() req) {
        return this.gameService.getUserGame(req.user);
    }

}
