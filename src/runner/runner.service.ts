import { Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Repository } from 'redis-om';
import { Server } from 'socket.io';
import { client } from 'src/app.service';
import { EventRegister } from 'src/event/dto/event-register.dto';
import { UpdateGameColors } from 'src/event/dto/update-game-colors.dto';
import { UpdateGameMap } from 'src/event/dto/update-game-map.dto';
import { UpdateGameTimer } from 'src/event/dto/update-game-timer.dto';
import { EventType } from 'src/event/entity/event.enum';
import { Game, game_schema } from 'src/game/entity/game.entity';
import { logger } from 'src/main';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { PlaceSinglePixel } from 'src/pixel/dto/place-single-pixel.dto';
import { PixelService } from 'src/pixel/pixel.service';
import { RunnerGateway } from './runner.gateway';

@Injectable()
export class RunnerService {

    private gameRepo: Repository<Game>;

    constructor(
        private readonly pixelHistoryService: PixelHistoryService,
        private readonly pixelService: PixelService,
        private readonly runnerGateway: RunnerGateway
    ) {}


    private getAssociatedValue(wantedValue: string, values: string[]): string {
      let val;
      values.forEach(el => {
        if (wantedValue.includes(el.split(':')[0])) val = el.split(':')[1];
      });
      return val;
    }

    async increaseMapSize(newMap: UpdateGameMap) {
      this.gameRepo = client.fetchRepository(game_schema);
      try {
        const count = await this.pixelHistoryService.increaseMapSize(newMap);

        let pixelArr = [];
        for(let i=Math.sqrt(count)+1; i<newMap.width+1; i++) {
          for(let j=1; j<newMap.width+1; j++) {
            if(!pixelArr.includes(`${i} ${j}`)) {
              const pixel1 = new PlaceSinglePixel();
              pixel1.color = "white";
              pixel1.coord_x = i;
              pixel1.coord_y = j;
              pixel1.pscope = 'root';
              pixel1.username = newMap.gameMasterUsername;
              await this.pixelService.placeSinglePixel(pixel1);
              pixelArr.push(`${i} ${j}`);
            }
            if(!pixelArr.includes(`${j} ${i}`)) {
              const pixel2 = new PlaceSinglePixel();
              pixel2.color = "white";
              pixel2.coord_x = j;
              pixel2.coord_y = i;
              pixel2.pscope = 'root';
              pixel2.username = newMap.gameMasterUsername;
              await this.pixelService.placeSinglePixel(pixel2);
              pixelArr.push(`${j} ${i}`);
            }
          }
        }
        
        await this.pixelHistoryService.pushOnMySQL();
        
        const game: Game = await this.gameRepo.search().where('name').eq('Game').return.first();
        game.width = newMap.width;
        await this.gameRepo.save(game);

        this.runnerGateway.sendGameEvent({
          width: newMap.width
        });

      } catch (err) {
        logger.error(err);
      }
    }

    async updateTimer(newTimer: UpdateGameTimer) {
      this.gameRepo = client.fetchRepository(game_schema);
      const game: Game = await this.gameRepo.search().where('name').eq('Game').return.first();
      game.timer = newTimer.timer;
      await this.gameRepo.save(game);

      this.runnerGateway.sendGameEvent({
        timer: newTimer.timer
      });
    }

    async updateColors(newColors: UpdateGameColors) {
      this.gameRepo = client.fetchRepository(game_schema);
      const game: Game = await this.gameRepo.search().where('name').eq('Game').return.first();
      game.colors = newColors.colors;
      await this.gameRepo.save(game);

      this.runnerGateway.sendGameEvent({
        colors: newColors.colors
      });
    }


    

    /*  Body example
        "type": "game:map",
        "values": [
            "gameMasterUsername:ddassieu", "width:20"
        ],
        "schedule": "2022-07-23T13:30:00"
    */
    register_increaseMap(event: EventRegister): UpdateGameMap {
        const val = new UpdateGameMap();
        val.gameMasterUsername = this.getAssociatedValue('gameMasterUsername', event.values);
        val.width = parseInt(this.getAssociatedValue('width', event.values));
        return val;
    }

    /*  Body example - timer in second
        "type": "game:timer",
        "values": [
            "timer:50"
        ],
        "schedule": "2022-07-23T13:30:00"
    */
    register_updateTimer(event: EventRegister): UpdateGameTimer {
      const val = new UpdateGameTimer();
      val.timer = parseInt(this.getAssociatedValue('timer', event.values));
      return val;
    }

    /*  Body example
        "type": "game:colors",
        "values": [
            "colors:#F546BC,#20AD5A"
        ],
        "schedule": "2022-07-23T13:30:00"
    */
    register_updateColors(event: EventRegister): UpdateGameColors {
      const val = new UpdateGameColors();
      val.colors = [];
      for(let color of this.getAssociatedValue('colors', event.values).split(',')) {
        val.colors.push(color);
      }
      return val;
    }

}
