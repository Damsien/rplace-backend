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
import { UserSpec } from './type/user-spec.type';
import { UpdateGame } from './dto/update-game.dto';
import { ServerGameSpec } from './type/server-game-spec.type';

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
        await this.userService.createUserIfNotExists({username: game.gameMasterUsername, pscope: 'root', password: null})
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

    async getUserGameMap(user: UserPayload): Promise<AllGame> {
      this.repo = client.fetchRepository(game_schema);
      const userRedis = await this.userService.getUserRedis(`${user.pscope}.${user.username}`);
      const game: Game = await this.repo.search().where('name').eq('Game').return.first();
      const map = await this.pixelService.getMap();
      return {
        now: new Date(Date.now()),
        lastPixelPlaced: userRedis.lastPlacedPixel,
        timer: userRedis.timer != null ? userRedis.timer : game.timer,
        map: map,
        width: game.width,
        colors: userRedis.getColors() != null ? [...game.getColors(), ...userRedis.getColors()] : game.getColors(),
        bombs: userRedis.bombAvailable,
        stickedPixels: userRedis.stickedPixelAvailable
      };
    }

    async getGlobalGameSpec(): Promise<GameSpec> {
      this.repo = client.fetchRepository(game_schema);
      const game: Game = await this.repo.search().where('name').eq('Game').return.first();
      return {
        timer: game.timer,
        width: game.width,
        colors: game.getColors()
      };
    }

    async getUserGame(user: UserPayload): Promise<UserSpec> {
      this.repo = client.fetchRepository(game_schema);
      const userRedis = await this.userService.getUserRedis(`${user.pscope}.${user.username}`);
      const allGame: Game = await this.repo.search().where('name').eq('Game').return.first();
      const steps = allGame.getSteps();
      const rank = await this.userService.getUserRank(userRedis);
      const fav = await this.userService.getUserFavColor(userRedis.entityId);
      const group = userRedis.group;
      return {
        pixelsPlaced: userRedis.pixelsPlaced,
        isGold: userRedis.isUserGold,
        bombs: userRedis.bombAvailable,
        stickedPixels: userRedis.stickedPixelAvailable,
        rank: rank,
        favColor: fav,
        pscope: user.pscope,
        username: user.username,
        steps: steps,
        group: group
      };
    }


    async serverGetGlobalGameSpec(): Promise<ServerGameSpec> {
      this.repo = client.fetchRepository(game_schema);
      const game: Game = await this.repo.search().where('name').eq('Game').return.first();
      return {
        timer: game.timer,
        width: game.width,
        colors: game.getColorsName(),
        isMapReady: game.isMapReady
      };
    }

    async getAssociatedColor(name: string) {
      this.repo = client.fetchRepository(game_schema);
      const game: Game = await this.repo.search().where('name').eq('Game').return.first();
      return game.getHexFromName(name);
    }


}
