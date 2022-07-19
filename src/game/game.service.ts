import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { EventService } from 'src/event/event.service';
import { logger } from 'src/main';
import { PixelService } from 'src/pixel/pixel.service';
import { StartGame } from './dto/start-game.dto';
import { StopGame } from './dto/stop-game.dto';
import { Game, game_schema } from './entity/game.entity';
import { client } from 'src/app.service';
import { Repository } from 'redis-om';
import { UserPayload } from 'src/auth/type/userpayload.type';
import { GameSpec } from './type/game-spec.type';
import { AllGame } from './type/all-game.type';
import { UserService } from 'src/user/user.service';
import { UserSpec } from './type/user-spec';
import { UpdateGame } from './dto/update-game.dto';

@Injectable()
export class GameService {

    private repo: Repository<Game>;

    constructor(
      private readonly pixelService: PixelService,
      private readonly userService: UserService,
      private readonly schedulerRegistry: SchedulerRegistry
    ) {}

    startGame(game: StartGame): number {
      const milliseconds = EventService.findMsDifference(new Date(), game.schedule);

      const timeout = setTimeout(async () => {
        await this.userService.createUser({username: game.gameMasterUser, pscope: 'root'})
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
      try {
        const timeout = this.schedulerRegistry.getTimeout('startGame');
        clearTimeout(timeout);
        this.schedulerRegistry.deleteTimeout('startGame');
      } catch(e) {
        throw new HttpException('The game start can\'t be cancelled', HttpStatus.CONFLICT);
      }
    }

    stopGame(game: StopGame): number {
      const milliseconds = EventService.findMsDifference(new Date(), game.schedule);

      const timeout = setTimeout(() => {
        this.schedulerRegistry.deleteTimeout('startGame');
        this.schedulerRegistry.deleteTimeout('stopGame');
      }, milliseconds);

      try {
        this.schedulerRegistry.addTimeout('stopGame', timeout);
      } catch(e) {
        throw new HttpException('The stop game schedule already exists', HttpStatus.CONFLICT);
      }

      return milliseconds;
    }
    cancelGameStop() {
      try {
        const timeout = this.schedulerRegistry.getTimeout('stopGame');
        clearTimeout(timeout);
        this.schedulerRegistry.deleteTimeout('stopGame');
      } catch(e) {
        throw new HttpException('The game stop can\'t be cancelled', HttpStatus.CONFLICT);
      }
    }

    async getGlobalGame(): Promise<AllGame> {
      this.repo = client.fetchRepository(game_schema);
      const game: Game = await this.repo.fetch('Game');
      const map = await this.pixelService.getMap();
      return {
        timer: game.timer,
        map: map,
        width: game.width,
        colors: game.colors
      };
    }

    async getGlobalGameSpec(): Promise<GameSpec> {
      this.repo = client.fetchRepository(game_schema);
      const game: Game = await this.repo.fetch('Game');
      logger.debug(game);
      return {
        timer: game.timer,
        width: game.width,
        colors: game.colors
      }
    }

    async getUserGame(user: UserPayload): Promise<UserSpec> {
      this.repo = client.fetchRepository(game_schema);
      const userEntity = await this.userService.getUserById(`${user.pscope}.${user.username}`);
      const allGame: Game = await this.repo.fetch('Game');
      return {
        timer: userEntity.timer != null ? userEntity.timer : allGame.timer,
        colors: userEntity.colors != null ? userEntity.colors : allGame.colors
      };
    }


}
