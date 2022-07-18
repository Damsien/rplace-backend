import { Body, Controller, Delete, Get, HttpCode, Post, Put, UseGuards, Request } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { Roles } from 'src/user/decorator/roles.decorator';
import { RolesGuard } from 'src/user/guard/roles.guard';
import { Role } from 'src/user/type/role.enum';
import { StartGame } from './dto/start-game.dto';
import { StopGame } from './dto/stop-game.dto';
import { GameService } from './game.service';
import { UpdateGame } from './dto/update-game.dto';
import { client } from 'src/app.service';
import { Game, game_schema } from './entity/game.entity';
import { Repository } from 'redis-om';
import { logger } from 'src/main';
import { CancelGame } from './dto/cancel-game.dto';

@UseGuards(RolesGuard)
@UseGuards(AtAuthGuard)
@Roles(Role.ADMIN)
@Controller('game')
export class GameController {

    private repo: Repository<Game>;

    constructor(private readonly gameService: GameService) {
      this.repo = client.fetchRepository(game_schema);
    }

    @HttpCode(201)
    @Post('start')
    async startGame(@Body() query: StartGame) {
        const gameRedis = await this.repo.fetch(query.name);
        gameRedis.colors = query.colors;
        gameRedis.name = query.name;
        gameRedis.user = query.gameMasterUser;
        gameRedis.startSchedule = query.schedule;
        gameRedis.timer = query.timer;
        gameRedis.width = query.mapWidth;
        this.repo.save(gameRedis);
        const timeout = this.gameService.startGame(query);
        return `The game will start in ${timeout}ms (or ${query.schedule})`;
    }
    @HttpCode(202)
    @Delete('start')
    async cancelGameStart(@Body() query: CancelGame) {
        this.repo.remove(query.name);
        const timeout = this.gameService.cancelGameStart();
        return `The game start schedule has been cancelled`;
    }

    @HttpCode(201)
    @Post('stop')
    async stopGame(@Body() query: StopGame) {
        const gameRedis = await this.repo.fetch(query.name);
        gameRedis.stopSchedule = query.schedule;
        this.repo.save(gameRedis);
        const timeout = this.gameService.stopGame(query);
        return `The game will stop in ${timeout}ms (or ${query.schedule})`;
    }
    @HttpCode(202)
    @Delete('stop')
    async cancelGameStop(@Body() query: CancelGame) {
        const gameRedis = await this.repo.fetch(query.name);
        gameRedis.stopSchedule = null;
        this.repo.save(gameRedis);
        const timeout = this.gameService.cancelGameStop();
        return `The game stop schedule has been cancelled`;
    }

}
