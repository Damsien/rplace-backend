import { Injectable } from '@nestjs/common';
import { Repository } from 'redis-om';
import { client } from 'src/app.service';
import { UserPayload } from 'src/auth/type/userpayload.type';
import { StartGame } from 'src/game/dto/start-game.dto';
import { UpdateGameMap } from 'src/game/dto/update-game-map.dto';
import { logger } from 'src/main';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { GetSinglePixel } from './dto/get-single-pixel.dto';
import { PlaceSinglePixel } from './dto/place-single-pixel.dto';
import { Pixel, schema } from './entity/pixel.entity';

@Injectable()
export class PixelService {

    private repo: Repository<Pixel>;

    constructor(
      private readonly pixelHistoryService: PixelHistoryService
    ) {
      this.repo = client.fetchRepository(schema);
    }

    async getMap(): Promise<Pixel[]> {
      return await this.repo.search().return.all();
    }

    async getSinglePixel(pxl: GetSinglePixel): Promise<Pixel> {
      return await this.repo.search().where('coord_x').eq(pxl.coord_x).and('coord_y').eq(pxl.coord_y).return.first();
    }

    async placeSinglePixel(pxl: PlaceSinglePixel, user: UserPayload): Promise<Pixel> {

      // Create index for the Pixel entity if it's not existing
      // It's useful for RediSearch
      await this.repo.createIndex();

      const globalId = `${pxl.coord_x}-${pxl.coord_y}`;

      /*    Pushing pixel in Pixel section   */
      const pixel = await this.repo.fetch(globalId);
      pixel.coord_x = pxl.coord_x;
      pixel.coord_y = pxl.coord_y;
      pixel.color = pxl.color;
      pixel.user = `${user.pscope}.${user.username}`;
      pixel.date = new Date();

      this.repo.save(pixel);

      /*    Pushing pixel in PixelHistory section   */
      this.pixelHistoryService.addSinglePixel(pixel);

      return pixel;
    }
    

    async startGame(game: StartGame) {

      try {
        const size = await this.pixelHistoryService.createMap(game.mapWidth);
  
        for (let i=1; i<Math.sqrt(size)+1; i++) {
          for(let j=1; j<Math.sqrt(size)+1; j++) {
            const pixel = new PlaceSinglePixel();
            pixel.color = "white";
            pixel.coord_x = i;
            pixel.coord_y = j;
            await this.placeSinglePixel(pixel, {username: game.gameMasterUsername, pscope: 'all'});
          }
        }
  
        await this.pixelHistoryService.pushOnMySQL();
      } catch(err) {
        logger.error(err);
      }
    }

    async increaseMapSize(newMap: UpdateGameMap) {
      const count = await this.pixelHistoryService.increaseMapSize(newMap);

      let pixelArr = [];
      for(let i=Math.sqrt(count)+1; i<newMap.width+1; i++) {
        for(let j=1; j<newMap.width+1; j++) {
          if(!pixelArr.includes(`${i} ${j}`)) {
            const pixel1 = new PlaceSinglePixel();
            pixel1.color = "white";
            pixel1.coord_x = i;
            pixel1.coord_y = j;
            this.placeSinglePixel(pixel1, {username: newMap.gameMasterUsername, pscope: 'all'});
            pixelArr.push(`${i} ${j}`);
          }
          if(!pixelArr.includes(`${j} ${i}`)) {
            const pixel2 = new PlaceSinglePixel();
            pixel2.color = "white";
            pixel2.coord_x = j;
            pixel2.coord_y = i;
            this.placeSinglePixel(pixel2, {username: newMap.gameMasterUsername, pscope: 'all'});
            pixelArr.push(`${j} ${i}`);
          }
        }
      }
      
      await this.pixelHistoryService.pushOnMySQL();
    }

}
