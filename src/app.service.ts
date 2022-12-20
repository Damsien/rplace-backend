import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Client, Repository, } from 'redis-om';
import { MoreThanOrEqual, Repository as SQLRepo } from 'typeorm';
import { EventRegister } from './event/dto/event-register.dto';
import { EventEntity } from './event/entity/event.entity';
import { EventService } from './event/event.service';
import { StartGame } from './game/dto/start-game.dto';
import { StopGame } from './game/dto/stop-game.dto';
import { Game, game_schema } from './game/entity/game.entity';
import { GameService } from './game/game.service';
import { logger } from './main';

export const client = new Client();

@Injectable()
export class AppService implements OnModuleInit {

    private gameRepo: Repository<Game>;
  
    constructor(
        private configService: ConfigService,
        private readonly gameService: GameService,
        private readonly eventService: EventService,
        @InjectRepository(EventEntity) private eventRepo: SQLRepo<EventEntity>,
    ) {
        client.open(this.configService.get<string>('REDIS_HOST'));
        this.gameRepo = client.fetchRepository(game_schema);
    }


    private async searchForGame() {
        await this.gameRepo.createIndex();
        const game: Game = await this.gameRepo.search().where('name').eq('Game').return.first();
        if (game != undefined) {
            const gameStart = new StartGame();
            gameStart.steps = game.getSteps();
            gameStart.colors = game.getColors();
            gameStart.gameMasterUsername = game.user;
            gameStart.mapWidth = game.width;
            gameStart.timer = game.timer;
            gameStart.schedule = game.startSchedule;
            await this.gameService.startGame(gameStart);

            if (game.stopSchedule) {
                const gameStop = new StopGame();
                gameStop.schedule = game.stopSchedule;
                await this.gameService.stopGame(gameStop);
            }
        }
    }

    private async searchForEvents() {
        try {
            const events: EventEntity[] = await this.eventRepo.find({where: {schedule: MoreThanOrEqual(new Date())}});
            for (let event of events) {
                const eventReg = new EventRegister();
                eventReg.type = event.type;
                eventReg.values = JSON.parse(event.values);
                eventReg.schedule = event.schedule;
                const pscope = event.userId.split('.')[0];
                const username = event.userId.split('.')[1];
                this.eventService.registerNewEvent(eventReg, {username: username, pscope: pscope});
            }
        } catch (err) {
            logger.debug('[AppService/searchForEvent] ' + err);
        }
    }

    async onModuleInit() {
        await this.searchForGame();
        await this.searchForEvents();
    }

}
