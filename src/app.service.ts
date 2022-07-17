import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Client, Repository, } from 'redis-om';
import { Repository as SQLRepo } from 'typeorm';
import { EventRegister } from './event/dto/event-register.dto';
import { EventEntity } from './event/entity/event.entity';
import { EventService } from './event/event.service';
import { StartGame } from './game/dto/start-game.dto';
import { StopGame } from './game/dto/stop-game.dto';
import { Game, game_schema } from './game/entity/game.entity';
import { GameService } from './game/game.service';

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
        const game: Game = await this.gameRepo.search().return.all()[0];
        if (game) {
            const gameStart = new StartGame();
            gameStart.colors = game.colors;
            gameStart.gameMasterUser = game.user;
            gameStart.mapWidth = game.width;
            gameStart.name = game.name;
            gameStart.timer = game.timer;
            gameStart.schedule = game.startSchedule;
            await this.gameService.startGame(gameStart);

            if (game.stopSchedule) {
                const gameStop = new StopGame();
                gameStop.name = game.name;
                gameStop.schedule = game.stopSchedule;
                await this.gameService.stopGame(gameStop);
            }
        }
    }

    private async searchForEvents() {
        const events: EventEntity[] = await this.eventRepo.find();
        for (let event of events) {
            const eventReg = new EventRegister();
            eventReg.type = event.type;
            eventReg.values = event.values;
            eventReg.schedule = event.schedule;
            const pscope = event.user.split('.')[0];
            const username = event.user.split('.')[1];
            this.eventService.registerNewEvent(eventReg, {username: username, pscope: pscope});
        }
    }

    async onModuleInit() {
        await this.searchForGame();
        await this.searchForEvents();
    }

}
