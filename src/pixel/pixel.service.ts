import { Injectable } from '@nestjs/common';
import { Repository } from 'redis-om';
import { client } from 'src/app.service';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { UserPixelHistoryService } from 'src/user-pixel-history/user-pixel-history.service';
import { GetSinglePixel } from './dto/get-single-pixel.dto';
import { PlaceSinglePixel } from './dto/place-single-pixel.dto';
import { Pixel, schema } from './entity/pixel.entity';

@Injectable()
export class PixelService {

    private repo: Repository<Pixel>;

    constructor(
      private readonly pixelHistoryService: PixelHistoryService,
      private readonly userPixelHistoryService: UserPixelHistoryService
    ) {
      this.repo = client.fetchRepository(schema);
    }

    async getMap(): Promise<Pixel[]> {
      return await this.repo.search().return.all();
    }

    async getSinglePixel(pxl: GetSinglePixel): Promise<Pixel> {
      return await this.repo.search().where('coord_x').eq(pxl.coord_x).and('coord_y').eq(pxl.coord_y).return.first();
    }

    async placeSinglePixel(pxl: PlaceSinglePixel): Promise<Pixel> {

      // Create index for the Pixel entity if it's not existing
      // It's useful for RediSearch
      await this.repo.createIndex();

      let globalId = `${pxl.coord_x}-${pxl.coord_y}`;

      /*    Pushing pixel in Pixel section   */
      let pixel = await this.repo.fetch(globalId);
      pixel.coord_x = pxl.coord_x;
      pixel.coord_y = pxl.coord_y;
      pixel.color = pxl.color;
      pixel.username = pxl.username;
      pixel.date = pxl.date;

      this.repo.save(pixel);


      /*    Pushing pixel in PixelHistory section   */
      this.pixelHistoryService.placeSinglePixel(pxl);

      /*    Pushing pixel in UserHistory section   */
      this.userPixelHistoryService.placeSinglePixel(pxl);

      return pixel;
    }

}
