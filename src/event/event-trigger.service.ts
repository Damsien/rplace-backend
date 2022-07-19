import { Injectable } from "@nestjs/common";
import { WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Repository } from "redis-om";
import { client } from "src/app.service";
import { Game, game_schema } from "src/game/entity/game.entity";
import { PixelHistoryService } from "src/pixel-history/pixel-history.service";
import { PlaceSinglePixel } from "src/pixel/dto/place-single-pixel.dto";
import { PixelService } from "src/pixel/pixel.service";
import { EventRegister } from "./dto/event-register.dto";
import { UpdateGameMap } from "./dto/update-game-map.dto";
import { UpdateGameTimer } from "./dto/update-game-timer.dto";
import { UpdateGameColors } from "./dto/update-game-colors.dto";

@Injectable()
export class EventTriggerService {

    @WebSocketServer()
    server: Server;

    private gameRepo: Repository<Game>;

    constructor(
        private readonly pixelService: PixelService,
        private readonly pixelHistoryService: PixelHistoryService
    ) {}


    private getAssociatedValue(wantedValue: string, values: string[]): string {
        values.forEach(el => {
            if (el.split(':')[0] == wantedValue) return el.split(':')[1];
        });
        return null;
    }

    private async increaseMapSize(newMap: UpdateGameMap) {
      this.gameRepo = client.fetchRepository(game_schema);
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
            this.pixelService.placeSinglePixel(pixel1);
            pixelArr.push(`${i} ${j}`);
          }
          if(!pixelArr.includes(`${j} ${i}`)) {
            const pixel2 = new PlaceSinglePixel();
            pixel2.color = "white";
            pixel2.coord_x = j;
            pixel2.coord_y = i;
            pixel2.pscope = 'root';
            pixel2.username = newMap.gameMasterUsername;
            this.pixelService.placeSinglePixel(pixel2);
            pixelArr.push(`${j} ${i}`);
          }
        }
      }
      
      await this.pixelHistoryService.pushOnMySQL();
      
      const game: Game = await this.gameRepo.fetch('Game');
      game.width = newMap.width;
      await this.gameRepo.save(game);

      this.server.emit('game', {
        width: newMap.width
      });
    }

    private async updateTimer(newTimer: UpdateGameTimer) {
      this.gameRepo = client.fetchRepository(game_schema);
      const game: Game = await this.gameRepo.fetch('Game');
      game.timer = newTimer.timer;
      await this.gameRepo.save(game);

      this.server.emit('game', {
        timer: newTimer.timer
      });
    }

    private async updateColors(newColors: UpdateGameColors) {
      const game: Game = await this.gameRepo.fetch('Game');
      game.colors = newColors.colors;
      await this.gameRepo.save(game);

      this.server.emit('game', {
        colors: newColors.colors
      });
    }

    

    /*  Body example
        "type": "game:map",
        "values": [
            "gameMasterUsername:ddassieu", "width:20"
        ],
        "schedule": "1657983277"
    */
    register_increaseMap(event: EventRegister): [Function, any] {
        const val = new UpdateGameMap();
        val.gameMasterUsername = this.getAssociatedValue('gameMasterUsername', event.values);
        val.width = parseInt(this.getAssociatedValue('width', event.values));
        return [this.increaseMapSize, val];
    }

    /*  Body example - timer in second
        "type": "game:timer",
        "values": [
            "timer:50"
        ],
        "schedule": "1657983277"
    */
    register_updateTimer(event: EventRegister): [Function, any] {
      const val = new UpdateGameTimer();
      val.timer = parseInt(this.getAssociatedValue('timer', event.values));
      return [this.updateTimer, val];
    }

    /*  Body example
        "type": "game:colors",
        "values": [
            "colors:#F546BC,#20AD5A"
        ],
        "schedule": "1657983277"
    */
    register_updateColors(event: EventRegister): [Function, any] {
      const val = new UpdateGameColors();
      for(let color of this.getAssociatedValue('timer', event.values).split(',')) {
        val.colors.push(color);
      }
      return [this.updateColors, val];
    }

}