import { ConflictException, HttpCode, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { client } from 'src/app.service';
import { logger } from 'src/main';
import { PixelSQL } from 'src/pixel/entity/pixel-sql.entity';
import { Pixel } from 'src/pixel/entity/pixel.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PixelHistory } from './entity/pixel-history.entity';

@Injectable()
export class PixelHistoryService {
  
  constructor(
    private dataSoucre: DataSource,
    @InjectRepository(PixelHistory) private pixelHistoRepo: Repository<PixelHistory>,
    @InjectRepository(PixelSQL) private pixelRepo: Repository<PixelSQL>
  ) {}

  addSinglePixel(pxl: Pixel) {
    let globalId = `${pxl.coord_x}-${pxl.coord_y}`;
    
    let pixelHistoryId = `PixelHistory:${globalId}`;
    
    client.execute(['XADD', `${pixelHistoryId}`, '*',
      'coord_x', pxl.coord_x,
      'coord_y', pxl.coord_y,
      'color', pxl.color,
      'username', pxl.username,
      'date', pxl.date.toString()
    ]);
  }



  private async delStreams() {
    let streams;
    streams = await client.execute([
      'KEYS', 'PixelHistory:*'
    ]);

    for(let stream of streams) {
      await client.execute([
        'DEL', stream
      ]);
    }
  }
  
  private async getSinglePixelStream(pixelStream): Promise<Array<PixelHistory>> {
    let stream;
    stream = await client.execute([
      'XRANGE', pixelStream,
      '-', '+'
    ]);

    let history = new Array<PixelHistory>();

    for(let i=0; i<stream.length; i++) {
      let pixelHistoryRedis = stream[i][1];
      let pixelHistory = new PixelHistory();
      pixelHistory.pixelId = (await this.pixelRepo.findOne({where: {coord_x: pixelHistoryRedis[1], coord_y: pixelHistoryRedis[3]}})).pixelId;
      pixelHistory.date = new Date(pixelHistoryRedis[9]);
      pixelHistory.username = pixelHistoryRedis[7];
      pixelHistory.color = pixelHistoryRedis[5];
      history.push(pixelHistory);
    }

    return history;
  }

  private async getPixels(): Promise<Array<PixelHistory[]>> {

    let pixelHistory = new Array<PixelHistory[]>();

    let streams;
    streams = await client.execute([
      'SCAN', '0',
      'TYPE', 'stream',
      //'MATCH', 'PixelHistory'
    ]);

    for(let i=0; i<streams[1].length; i++) {
      pixelHistory.push(await this.getSinglePixelStream(streams[1][i]));
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

      for(let i=0; i<pixels.length; i++) {
        for(let j=0; j<pixels[i].length; j++) {
          let pixel: PixelHistory = pixels[i][j];

          await qRunner.manager.save(pixel);
        }
      }
  
      await qRunner.commitTransaction();

      await this.delStreams();
    } catch (err) {
      logger.debug(err);
      // since we have errors lets rollback the changes we made
      await qRunner.rollbackTransaction();
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await qRunner.release();
    }
  }


  async createMap() {
    const qRunner = this.dataSoucre.createQueryRunner();
    await qRunner.connect();
    await qRunner.startTransaction();

    if((await this.pixelRepo.count({})) <= 361) {
      throw new ConflictException();
    }
      
    try {
      for(let i=1; i<20; i++) {
        for(let j=1; j<20; j++) {
          let pixel = new PixelSQL();
          pixel.coord_x = i;
          pixel.coord_y = j;
          await qRunner.manager.save(pixel);
        }
      }
  
      await qRunner.commitTransaction();
    } catch (err) {
      throw new ConflictException();
      // since we have errors lets rollback the changes we made
      await qRunner.rollbackTransaction();
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await qRunner.release();
    }

    return 'Map created';
  }

}
