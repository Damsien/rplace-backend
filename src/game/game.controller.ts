import { Body, Controller, Delete, Get, HttpCode, Post, Put, UseGuards, Request } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { Roles } from 'src/user/decorator/roles.decorator';
import { RolesGuard } from 'src/user/guard/roles.guard';
import { Role } from 'src/user/type/role.enum';
import { StartGame } from './dto/start-game.dto';
import { StopGame } from './dto/stop-game.dto';
import { UpdateGameMap } from './dto/update-game-map.dto';
import { GameService } from './game.service';
import { GameGuard } from './guard/game.guard';
import { GameSpec } from './type/game-spec.type';

@UseGuards(RolesGuard)
@UseGuards(AtAuthGuard)
@Roles(Role.ADMIN)
@Controller('game')
export class GameController {

    constructor(private readonly gameService: GameService) {}

    @HttpCode(201)
    @Post('start')
    startGame(@Body() query: StartGame) {
        const timeout = this.gameService.startGame(query);
        return `The game will start in ${timeout}ms (or ${query.schedule})`;
    }
    @HttpCode(202)
    @Delete('start')
    cancelGameStart() {
        const timeout = this.gameService.cancelGameStart();
        return `The game start schedule has been cancelled`;
    }

    @HttpCode(201)
    @Post('stop')
    async stopGame(@Body() query: StopGame) {
        const timeout = this.gameService.stopGame(query);
        return `The game will stop in ${timeout}ms (or ${query.schedule})`;
    }
    @HttpCode(202)
    @Delete('stop')
    cancelGameStop() {
        const timeout = this.gameService.cancelGameStop();
        return `The game stop schedule has been cancelled`;
    }

    @HttpCode(204)
    @Put()
    updateGameSpec(@Body() specs: GameSpec) {
        this.gameService.changeGameSpecs(specs);
    }

}
