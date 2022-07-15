import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { logger } from 'src/main';
import { PixelService } from 'src/pixel/pixel.service';
import { StartGame } from './dto/start-game.dto';
import { StopGame } from './dto/stop-game.dto';
import { UpdateGameMap } from './dto/update-game-map.dto';

@Injectable()
export class GameService {

    constructor(private readonly pixelService: PixelService, private schedulerRegistry: SchedulerRegistry) {}

    private findMsDifference(date1, date2) { 
      var oneSecond_ms = 1000;
  
      // Convert both dates to milliseconds
      var date1_ms = date1.getTime();
      var date2_ms = date2.getTime();

      // Calculate the difference in milliseconds
      var difference_ms = date2_ms - date1_ms;
        
      // Convert back to days and return
      return Math.round(difference_ms); 
    }

    startGame(game: StartGame): number {
      const milliseconds = this.findMsDifference(new Date(), game.schedule);

      const timeout = setTimeout(() => {
        this.pixelService.startGame(game);
      }, milliseconds);

      try {
        this.schedulerRegistry.addTimeout('startGame', timeout);
      } catch(e) {
        throw new HttpException('The start game schedule already exists', HttpStatus.CONFLICT);
      }

      return milliseconds;
    }
    cancelGameStart() {
      const timeout = this.schedulerRegistry.getTimeout('startGame');
      clearTimeout(timeout);
      this.schedulerRegistry.deleteTimeout('startGame');
    }

    increaseMapSize(map: UpdateGameMap) {
      const milliseconds = this.findMsDifference(new Date(), map.schedule);

      const timeout = setTimeout(() => {
        this.pixelService.increaseMapSize(map);
        this.schedulerRegistry.deleteTimeout('updateMap');
      }, milliseconds);

      this.schedulerRegistry.addTimeout('updateMap', timeout);

      return milliseconds;
    }
    cancelMapUpdate() {
      const timeout = this.schedulerRegistry.getTimeout('updateMap');
      clearTimeout(timeout);
      this.schedulerRegistry.deleteTimeout('updateMap');
    }

    stopGame(game: StopGame) {
      const milliseconds = this.findMsDifference(new Date(), game.schedule);

      const timeout = setTimeout(() => {
        this.schedulerRegistry.deleteTimeout('startGame');
        this.schedulerRegistry.deleteTimeout('stopGame');
      }, milliseconds);

      this.schedulerRegistry.addTimeout('stopGame', timeout);

      return milliseconds;
    }
    cancelGameStop() {
      const timeout = this.schedulerRegistry.getTimeout('stopGame');
      clearTimeout(timeout);
      this.schedulerRegistry.deleteTimeout('stopGame');
    }

}
