import { Controller, Get, HttpCode, Param, Request, UseGuards } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { UserPayload } from 'src/auth/type/userpayload.type';
import { GameService } from 'src/game/game.service';
import { GameGuard } from 'src/game/guard/game.guard';

@UseGuards(GameGuard)
@UseGuards(AtAuthGuard)
@Controller('user')
export class UserController {

    constructor(private readonly gameService: GameService) {}

    @HttpCode(200)
    @Get('/:id')
    getOtherUserSpec(@Param('id') id: string) {
        const user: UserPayload = {
          pscope: id.split('-')[0],
          username: id.split('-')[1],
        };
        return this.gameService.getUserGame(user);
    }

    @HttpCode(200)
    @Get('/spec')
    getUserGameSpec(@Request() req) {
        return this.gameService.getUserGame(req.user);
    }

    @HttpCode(200)
    @Get('/username')
    getUsername(@Request() req) {
        return {pscope: req.user.pscope, username: req.user.username};
    }
    
    @HttpCode(200)
    @Get('game/all')
    getAllGame(@Request() req) {
        return this.gameService.getUserGameMap(req.user);
    }

    @HttpCode(200)
    @Get('game/spec')
    getAllGameSpec() {
        return this.gameService.getGlobalGameSpec();
    }

}
