import { forwardRef, HttpException, HttpStatus, Inject, Injectable, UseGuards } from '@nestjs/common';
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
import { AllGlobalGame } from './type/all-global-game';
import { RunnerGateway } from 'src/runner/runner.gateway';
import { PixelGateway } from 'src/pixel/pixel.gateway';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from "socket.io";
import { WsGuard } from 'src/auth/guard/ws.guard';
import { Step } from './type/step.type';

@Injectable()
export class GameService {

    private repo: Repository<Game>;

    constructor(
      private readonly pixelService: PixelService,
      private readonly userService: UserService,
      private readonly schedulerRegistry: SchedulerRegistry
    ) {}

    // private async startGameSocket() {
    //   const repo = client.fetchRepository(game_schema);
    //   let game: Game = await repo.search().where('name').eq('Game').return.first();
    //   while (!game.isMapReady) {
    //       setInterval(() => {
    //           repo.search().where('name').eq('Game').return.first().then((gm) => {
    //               game = gm;
    //           });
    //       }, 3500);
    //   }
    //   this.server.emit('game', {
    //       start: (await this.getGlobalGameMap())
    //   });
    // }

    startGame(game: StartGame): number {
      const milliseconds = EventService.findMsDifference(new Date(), game.schedule);

      const timeout = setTimeout(async () => {
        await this.userService.createUserIfNotExists({username: game.gameMasterUsername, pscope: 'root', password: null})
        this.pixelService.startGame(game);
        // this.startGameSocket();
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
        // this.server.emit('game', 'stop');
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

    async getGlobalGameMap(): Promise<AllGlobalGame> {
      const game = await this.getGlobalGameSpec();
      const map = await this.pixelService.getMap();
      return {
        timer: game.timer,
        width: game.width,
        colors: game.colors,
        map: map
      };
    }

    async getUserGame(user: UserPayload): Promise<UserSpec> {
      this.repo = client.fetchRepository(game_schema);
      const userRedis = await this.userService.getUserRedis(`${user.pscope}.${user.username}`);
      let groupRank;
      if (userRedis.group) {
        const groupRedis = await this.userService.getGroupRedis(userRedis.group);
        groupRank = await this.userService.getGroupRank(groupRedis);
      }
      const allGame: Game = await this.repo.search().where('name').eq('Game').return.first();
      const steps = allGame.getSteps();
      const rank = await this.userService.getUserRank(userRedis);
      const favs = await this.userService.getUserFavColor(userRedis.entityId);
      const group = userRedis.group;
      return {
        pixelsPlaced: userRedis.pixelsPlaced,
        isGold: userRedis.isUserGold,
        bombs: userRedis.bombAvailable,
        stickedPixels: userRedis.stickedPixelAvailable,
        rank: rank,
        favColor: favs[0]['pixel_color'],
        pscope: user.pscope,
        username: user.username,
        steps: steps,
        group: group,
        groupRank: groupRank,
        secondFavColor: favs[1]['pixel_color']
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
      this.repo = client.fetchRepository(game_schema);
      const game: Game = await this.repo.search().where('name').eq('Game').return.first();
      return game.getHexFromName(name);
    }

    async changeConfiguration(steps: Step[]) {
      this.repo = client.fetchRepository(game_schema);
      const game: Game = await this.repo.search().where('name').eq('Game').return.first();
      game.setSteps(steps);
      await this.repo.save(game);
    }


}
