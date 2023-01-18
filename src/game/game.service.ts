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
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { user_schema } from 'src/user/entity/user.entity';
import { pixel_schema } from 'src/pixel/entity/pixel.entity';
import { Color } from './type/color.type';
import { UserGateway } from 'src/user/user.gateway';

@Injectable()
export class GameService {

    private repo: Repository<Game>;

    constructor(
      private readonly pixelService: PixelService,
      private readonly pixelHistoryService: PixelHistoryService,
      private readonly userService: UserService,
      private readonly schedulerRegistry: SchedulerRegistry,
      private readonly userGateway: UserGateway
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
      logger.debug('stop game scheduler');

      const timeout = setTimeout(() => {
        this.userGateway.sendGameEvent({'stop': true})
        try {
          this.schedulerRegistry.deleteTimeout('startGame');
        } catch (err) {}
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

      const colors: Color[] = [];
      const userColors = userRedis.getColors();
      for (let color of game.getColors()) {
        color.isUserColor = false;
        colors.push(color);
      }
      if (userColors != null) {
        for (let color of userColors) {
          color.isUserColor = true;
          colors.push(color);
        }
      }
      return {
        now: new Date(Date.now()),
        lastPixelPlaced: userRedis.lastPlacedPixel,
        timer: userRedis.timer != null ? userRedis.timer : game.timer,
        map: map,
        width: game.width,
        colors: colors,
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
        try{
          groupRank = await this.userService.getGroupRank(groupRedis);
        } catch (err) {
          groupRank = 1000;
        }
      }
      const allGame: Game = await this.repo.search().where('name').eq('Game').return.first();
      const steps = allGame.getSteps();
      let rank = 1000;
      try{
        rank = await this.userService.getUserRank(userRedis);
      } catch (err) {
        rank = 1000;
      }
      const favs = await this.userService.getUserFavColor(userRedis.entityId);
      const group = userRedis.group;
      return {
        pixelsPlaced: userRedis.pixelsPlaced,
        isGold: userRedis.isUserGold,
        bombs: userRedis.bombAvailable,
        stickedPixels: userRedis.stickedPixelAvailable,
        rank: rank,
        favColor: favs[0] != undefined ? favs[0]['pixel_color'] : 'white',
        pscope: user.pscope,
        username: user.username,
        steps: steps,
        group: group,
        groupRank: groupRank,
        secondFavColor: favs[1] != undefined ? favs[1]['pixel_color'] : 'white'
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

    async changeConfiguration(steps: Step[]) {
      this.repo = client.fetchRepository(game_schema);
      const game: Game = await this.repo.search().where('name').eq('Game').return.first();
      game.setSteps(steps);
      await this.repo.save(game);
    }




    /*    RECOVER DATA    */

    async recoverData(query: StartGame) {

      //  Rebuild game
      this.repo = client.fetchRepository(game_schema);
      await this.repo.createIndex();
      const gameRedis = await this.repo.fetch('Game');
      if (query) {
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
      }

      //  Rebuild pixels
      const pixels = await this.pixelHistoryService.getCurrentMapPixels();
      const pixelRepo = client.fetchRepository(pixel_schema);
      await pixelRepo.createIndex();
      // for (let pixel of pixels) {
      //   let pxl = await pixelRepo.fetch(`${pixel.coord_x}-${pixel.coord_y}`);
      //   pxl.coord_x = pixel.coord_x;
      //   pxl.coord_y = pixel.coord_y;
      //   pxl.user = pixel.userId;
      //   pxl.color = pixel.color;
      //   await pixelRepo.save(pxl);
      // }

      for (let i=0; i<gameRedis.width; i++) {
        for (let j=0; j<gameRedis.width; j++) {
          let pixel = pixels.find(el => el.coord_x == i && el.coord_y == j);
          let pxl = await pixelRepo.fetch(`${i}-${j}`);
          pxl.coord_x = i;
          pxl.coord_y = j;
          if (pixel != null && pixel != undefined) {
            pxl.user = pixel.userId;
            pxl.color = pixel.color;
          } else {
            pxl.user = 'root.game';
            pxl.color = 'white';
          }
          await pixelRepo.save(pxl);
        }
      }

      await this.pixelService.updateRedisMap();

      //  Rebuild users
      const users = await this.userService.getCurrentUsers();
      const userRepo = client.fetchRepository(user_schema);
      await userRepo.createIndex();
      for (let user of users) {
        let usr = await userRepo.fetch(user.userId);
        usr.stickedPixelAvailable = user.stickedPixelAvailable ?? 0;
        usr.isUserGold = user.isUserGold ?? false;
        await userRepo.save(usr);
      }

    }


    async getGameState() {
      this.repo = client.fetchRepository(game_schema);
      const game: Game = await this.repo.search().where('name').eq('Game').return.first();
      const now = new Date();
      if (game.startSchedule) {
        if (game.startSchedule > now) {
          return 'Ready';
        } else {
          if (game.stopSchedule) {
            if (game.stopSchedule > now) {
              return 'Occurs'
            } else {
              return 'Over';
            }
          } else {
            return 'Occurs';
          }
        }
      } else {
        return 'NotReady';
      }
    }


}
