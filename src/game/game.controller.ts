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
import { Whitelist, whitelist_schema } from 'src/auth/entity/whitelist.entity';
import { blacklist_schema } from 'src/auth/entity/blacklist.entity';
import { List } from './dto/list.dto';
import { Step } from './type/step.type';

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
        gameRedis.setSteps(query.steps);
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


    @HttpCode(201)
    @Post('whitelist')
    async setWhitelist(@Body() list: List) {
        const whitelistRepo = client.fetchRepository(whitelist_schema);
        whitelistRepo.createIndex();
        for (let admin of process.env.ROLE_ADMIN.split(',')) {
            let adm = await whitelistRepo.fetch(admin);
            adm.pscope = admin.split('.')[0];
            adm.username = admin.split('.')[1];
            whitelistRepo.save(adm);
        }
        for (let userId of list.list) {
            let wUser = await whitelistRepo.fetch(userId);
            wUser.pscope = userId.split('.')[0];
            wUser.username = userId.split('.')[1];
            whitelistRepo.save(wUser);
        }
    }
    @HttpCode(200)
    @Delete('whitelist')
    async removeFromWhitelist(@Body() list: List) {
        const whitelistRepo = client.fetchRepository(whitelist_schema);
        for (let userId of list.list) {
            await whitelistRepo.remove(userId);
        }
        if (await whitelistRepo.search().returnCount() == process.env.ROLE_ADMIN.split(',').length) {
            for (let admin of process.env.ROLE_ADMIN.split(',')) {
                whitelistRepo.remove(admin);
            }
        }
    }

    @HttpCode(201)
    @Post('blacklist')
    async setBlacklist(@Body() list: List) {
        const blacklistRepo = client.fetchRepository(blacklist_schema);
        blacklistRepo.createIndex();
        for (let userId of list.list) {
            if (!process.env.ROLE_ADMIN.includes(userId)) {
                let bUser = await blacklistRepo.fetch(userId);
                bUser.pscope = userId.split('.')[0];
                bUser.username = userId.split('.')[1];
                blacklistRepo.save(bUser);
            }
        }
    }
    @HttpCode(200)
    @Delete('blacklist')
    async removeFromBlacklist(@Body() list: List) {
        const blacklistRepo = client.fetchRepository(blacklist_schema);
        for (let userId of list.list) {
            blacklistRepo.remove(userId);
        }
    }

    @HttpCode(200)
    @Post('configure')
    async changeConfiguration(@Body() conf: Step[]) {
        this.gameService.changeConfiguration(conf);
    }

}
