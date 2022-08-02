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
        const gameRedis = await this.repo.fetch('Game');
        gameRedis.name = 'Game';
        gameRedis.setColors(query.colors);
        gameRedis.user = query.gameMasterUsername;
        gameRedis.startSchedule = query.schedule;
        gameRedis.timer = query.timer;
        gameRedis.width = query.mapWidth;
        gameRedis.isMapReady = false;
        gameRedis.isOperationReady = true;
        await this.repo.save(gameRedis);
        const timeout = this.gameService.startGame(query);
        return `The game will start in ${timeout}ms (or ${query.schedule})`;
    }
    @HttpCode(202)
    @Delete('start')
    async cancelGameStart() {
        this.repo.remove('Game');
        this.gameService.cancelGameStart();
        return `The game start schedule has been cancelled`;
    }

    @HttpCode(201)
    @Post('stop')
    async stopGame(@Body() query: StopGame) {
        const gameRedis = await this.repo.search().where('name').eq('Game').return.first();
        gameRedis.stopSchedule = query.schedule;
        this.repo.save(gameRedis);
        const timeout = this.gameService.stopGame(query);
        return `The game will stop in ${timeout}ms (or ${query.schedule})`;
    }
    @HttpCode(202)
    @Delete('stop')
    async cancelGameStop() {
        const gameRedis: Game = await this.repo.search().where('name').eq('Game').return.first();
        gameRedis.stopSchedule = null;
        this.repo.save(gameRedis);
        this.gameService.cancelGameStop();
        return `The game stop schedule has been cancelled`;
    }

}
