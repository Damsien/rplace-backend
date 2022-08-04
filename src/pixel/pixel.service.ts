import { Injectable } from '@nestjs/common';
import { Repository } from 'redis-om';
import { client } from 'src/app.service';
import { UserPayload } from 'src/auth/type/userpayload.type';
import { StartGame } from 'src/game/dto/start-game.dto';
import { logger } from 'src/main';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { GetSinglePixel } from './dto/get-single-pixel.dto';
import { PixelAnon } from './dto/pixel-anon.dto';
import { PlaceSinglePixel } from './dto/place-single-pixel.dto';
import { Pixel, schema } from './entity/pixel.entity';

@Injectable()
export class PixelService {

    private repo: Repository<Pixel>;

    constructor(
      private readonly pixelHistoryService: PixelHistoryService
    ) {}

    private async getJsonPixel(pxl: string): Promise<PixelAnon> {

      const json = await client.jsonget(pxl);

      const pixel = new PixelAnon();
      pixel.coord_x = json['coord_x'];
      pixel.coord_y = json['coord_y'];
      pixel.color = json['color'];
      
      return pixel;
    }

    private async fetchMapRaw(): Promise<PixelAnon[]> {
      let pixels = new Array<PixelAnon>();

      let all;
      all = await client.execute([
          'KEYS', 'Pixel:*'
      ]);

      for(let i=0; i<all.length; i++) {
        if (all[i] != 'Pixel:index:hash') {
          pixels.push(await this.getJsonPixel(all[i]));
        }
      }

      return pixels;
    }

    async getMap(): Promise<PixelAnon[]> {
      this.repo = client.fetchRepository(schema);
      return this.fetchMapRaw();
    }

    async getSinglePixel(pxl: GetSinglePixel): Promise<Pixel> {
      this.repo = client.fetchRepository(schema);
      return await this.repo.search().where('coord_x').eq(pxl.coord_x).and('coord_y').eq(pxl.coord_y).return.first();
    }

    async placeSinglePixel(pxl: PlaceSinglePixel): Promise<Pixel> {
      const user: UserPayload = {
          username: pxl.username,
          pscope: pxl.pscope
      };
      const userId = `${user.pscope}.${user.username}`;
      const now = new Date();

      this.repo = client.fetchRepository(schema);

      // Create index for the Pixel entity if it's not existing
      // It's useful for RediSearch
      await this.repo.createIndex();

      const globalId = `${pxl.coord_x}-${pxl.coord_y}`;

      /*    Pushing pixel in Pixel section   */
      const pixel = await this.repo.fetch(globalId);
      pixel.coord_x = pxl.coord_x;
      pixel.coord_y = pxl.coord_y;
      pixel.color = pxl.color;
      pixel.user = userId;
      pixel.date = now;

      this.repo.save(pixel);

      /*    Pushing pixel in PixelHistory section   */
      this.pixelHistoryService.addSinglePixel(pixel);

      return pixel;
    }
    

    async startGame(game: StartGame) {
      this.repo = client.fetchRepository(schema);

      try {
        const size = await this.pixelHistoryService.createMap(game.mapWidth);
  
        for (let i=1; i<Math.sqrt(size)+1; i++) {
          for(let j=1; j<Math.sqrt(size)+1; j++) {
            const pixel = new PlaceSinglePixel();
            pixel.color = "white";
            pixel.coord_x = i;
            pixel.coord_y = j;
            pixel.pscope = 'root';
            pixel.username = game.gameMasterUsername;
            await this.placeSinglePixel(pixel);
          }
        }
        
      } catch(err) {
        logger.error(err);
      }
    }

}
