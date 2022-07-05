import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { client } from 'src/app.service';
import { logger } from 'src/main';
import { PlaceSinglePixel } from 'src/pixel/dto/place-single-pixel.dto';
import { Stream } from 'stream';
import { DataSource, Repository } from 'typeorm';
import { PixelHistory } from './entity/pixel-history.entity';

@Injectable()
export class PixelHistoryService {
  
  constructor(
    private dataSoucre: DataSource,
    @InjectRepository(PixelHistory) private repo: Repository<PixelHistory>
  ) {}

  addSinglePixel(pxl: PlaceSinglePixel) {
    let globalId = `${pxl.coord_x}-${pxl.coord_y}`;
    
    let pixelHistoryId = `PixelHistory:${globalId}`;
    
    client.execute(['XADD', `${pixelHistoryId}`, '*',
      'coord_x', pxl.coord_x,
      'coord_y', pxl.coord_y,
      'color', pxl.color,
      'username', pxl.username,
      'date', pxl.date.getDate().toString()
    ]);
  }

  private async getSinglePixelStream(pixelStream): Promise<Array<PixelHistory>> {
    let stream: Array<string>;
    stream = await client.execute([
      'XRANGE', pixelStream,
      '-', '+'
    ]) as Array<string>;

    let history = new Array<PixelHistory>();
    stream.forEach((pixelHistoryRedis) => {
      let pixelHistory = new PixelHistory();
      pixelHistory.pixelId = pixelHistoryRedis['pixelId'];
      pixelHistory.date = pixelHistoryRedis['date'];
      pixelHistory.username = pixelHistoryRedis['username'];
      pixelHistory.color = pixelHistoryRedis['color'];
      history.push(pixelHistory);
    });

    return history;
  }

  private async getPixels(): Promise<Map<String, Array<PixelHistory>>> {

    let pixelHistory = new Map<String, Array<PixelHistory>>();

    let streams: Array<string>;
    streams = await client.execute([
      'SCAN', '0',
      'TYPE', 'stream',
      'MATCH', 'PixelHistory'
    ]) as Array<string>;
    logger.debug(streams);

    for(let i=0; i<streams.length; i++) {
      pixelHistory[streams[i]] = await this.getSinglePixelStream(streams[i]);
    }

    return pixelHistory;
  }

  @Interval('pushOnMySQL', 30000)
  async pushOnMySQL() {
    const qRunner = this.dataSoucre.createQueryRunner();
    await qRunner.connect();
    await qRunner.startTransaction();

    let pixels = await this.getPixels();

    try {
      await qRunner.manager.save(async manager => {
        for(let [, val] of pixels) {
          for(let pixel of val) {
            await manager.save(pixel);
          }
        }
      });
  
      await qRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await qRunner.rollbackTransaction();
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await qRunner.release();
    }
    
  }

}
