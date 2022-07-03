import { HttpCode, HttpException, Inject, Injectable, Query } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { Client, Repository, Schema } from 'redis-om';
import { logger } from 'src/main';
import { GetSinglePixel } from './dto/get-single-pixel.dto';
import { Pixel, schema } from './entity/pixel.entity';

export const client = new Client();

@Injectable()
export class PixelService {

    private repo: Repository<Pixel>;

    constructor() {
      client.open('redis://localhost:6379');
      this.repo = client.fetchRepository(schema);
    }

    async getMap(): Promise<Pixel[]> {
      return await this.repo.search().return.all();
    }

    async getSinglePixel(searchPxl: GetSinglePixel): Promise<Pixel> {      
      await this.repo.createIndex();

      // let pixel = this.repo.createEntity({entityId: `${searchPxl.coord_x}-${searchPxl.coord_y}`});
      let pixel = await this.repo.fetch(`${searchPxl.coord_x}-${searchPxl.coord_y}`);
      pixel.coord_x = Number(searchPxl.coord_x);
      pixel.coord_y = Number(searchPxl.coord_y);
      pixel.color = 'red';
      pixel.username = 'dassied';
      pixel.date = new Date();

      // let id = await this.repo.save(pixel);

      pixel.color = 'yellow';

      let keyname = `Pixel:2-4`;
      
      client.execute(['XADD', `${keyname}`, '*',
        'username', 'dassied',
        'color', `${pixel.color}`
      ]);

      return pixel;
    }

}
