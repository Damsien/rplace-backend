import { Body, Controller, Delete, HttpCode, Post, Put } from '@nestjs/common';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/type/role.enum';
import { StartGame } from './dto/start-game.dto';
import { StopGame } from './dto/stop-game.dto';
import { UpdateGameMap } from './dto/update-game-map.dto';
import { GameService } from './game.service';

@Controller('game')
export class GameController {

    constructor(private readonly gameService: GameService) {}

    @Roles(Role.ADMIN)
    @HttpCode(201)
    @Post('start')
    startGame(@Body() query: StartGame) {
        const timeout = this.gameService.startGame(query);
        return `The game will start in ${timeout}ms (or ${query.schedule})`;
    }
    @Roles(Role.ADMIN)
    @HttpCode(202)
    @Delete('start')
    cancelGameStart() {
        const timeout = this.gameService.cancelGameStart();
        return `The game start schedule has been cancelled`;
    }

    @Roles(Role.ADMIN)
    @HttpCode(204)
    @Put('map')
    updateMap(@Body() query: UpdateGameMap) {
        const timeout = this.gameService.increaseMapSize(query);
        return `The map will increase its size to ${query.width}*${query.width} pixels in ${timeout}ms (or ${query.schedule})`;
    }
    @Roles(Role.ADMIN)
    @HttpCode(202)
    @Delete('map')
    cancelMapUpdate() {
        const timeout = this.gameService.cancelMapUpdate();
        return `The update map schedule has been cancelled`;
    }

    @Roles(Role.ADMIN)
    @HttpCode(201)
    @Post('stop')
    async stopGame(@Body() query: StopGame) {
        const timeout = this.gameService.stopGame(query);
        return `The game will stop in ${timeout}ms (or ${query.schedule})`;
    }
    @Roles(Role.ADMIN)
    @HttpCode(202)
    @Delete('stop')
    cancelGameStop() {
        const timeout = this.gameService.cancelGameStop();
        return `The game stop schedule has been cancelled`;
    }

}
