import { HttpCode, HttpException, Inject, Injectable, Query } from '@nestjs/common';
import { createClient } from 'redis';
import { logger } from 'src/main';
import { GetSinglePixel } from './dto/get-single-pixel.dto';
import { Pixel } from './interfaces/pixel.interface';

@Injectable()
export class PixelService {

    private client = createClient({url: 'redis://localhost:6379'});

    constructor() {
      this.client.connect();
    }

    async getMap(): Promise<Pixel[]> {
      let allKeys = await this.client.keys('*');
      let rdsPixels = [];
      await allKeys.forEach(async (key) => {
        rdsPixels.push({'key': key, 'val': await this.client.hGetAll(key)});
      });

      let pixels: Pixel[] = [];
      rdsPixels.forEach((pixel) => {
        logger.debug(pixel);
        pixels.push({
          coord_x: pixel['key'].split(';')[0],
          coord_y: pixel['key'].split(';')[1],
          color: pixel['val'].color,
          username: pixel['val'].username,
          timestamp: pixel['val'].timestamp
        });
      });

      return pixels;
    }

    async getSinglePixel(pixel: GetSinglePixel): Promise<Pixel> {
      let coords = pixel.coord_x+';'+pixel.coord_y;
      let rds = await this.client.multi()
        .hGet(coords, 'color')
        .hGet(coords, 'username')
        .hGet(coords, 'timestamp');

      if(rds[0] == null) {
        return null;
      }

        let result: Pixel = {
          coord_x: pixel.coord_x,
          coord_y: pixel.coord_y,
          color: rds[0].toString(),
          username: rds[2].toString(),
          timestamp: rds[3].toString()
        };

        return result;
    }

}
