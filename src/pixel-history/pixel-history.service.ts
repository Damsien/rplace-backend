import { ConflictException, HttpCode, HttpException, HttpStatus, Inject, Injectable, NotAcceptableException } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { client } from 'src/app.service';
import { UpdateGameMap } from 'src/event/dto/update-game-map.dto';
import { StartGame } from 'src/game/dto/start-game.dto';
import { logger } from 'src/main';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { Pixel } from 'src/pixel/entity/pixel.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PixelHistoryEntity } from './entity/pixel-history.entity';

@Injectable()
export class PixelHistoryService {
  
  constructor(
    private dataSoucre: DataSource,
    @InjectRepository(PixelHistoryEntity) private pixelHistoRepo: Repository<PixelHistoryEntity>,
    @InjectRepository(PixelEntity) private pixelRepo: Repository<PixelEntity>
  ) {}


  async getLastPixelOfUser(userId: string): Promise<PixelHistoryEntity> {
    const pixels = await this.pixelHistoRepo.findBy({user: userId});
    return pixels[pixels.length];
  }


  async addSinglePixel(pxl: Pixel) {
    const globalId = `${pxl.coord_x}-${pxl.coord_y}`;
    
    const pixelHistoryId = `PixelHistory:${globalId}`;
    
    await client.execute(['XADD', `${pixelHistoryId}`, '*',
      'coord_x', pxl.coord_x,
      'coord_y', pxl.coord_y,
      'color', pxl.color,
      'username', pxl.user,
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
  
  private async getSinglePixelStream(pixelStream): Promise<Array<PixelHistoryEntity>> {
    let stream;
    stream = await client.execute([
      'XRANGE', pixelStream,
      '-', '+'
    ]);

    const history = new Array<PixelHistoryEntity>();

    for(let i=0; i<stream.length; i++) {
      const pixelHistoryRedis = stream[i][1];
      const pixelHistory = new PixelHistoryEntity();
      pixelHistory.pixelId = (await this.pixelRepo.findOne({where: {coord_x: pixelHistoryRedis[1], coord_y: pixelHistoryRedis[3]}})).pixelId;
      pixelHistory.date = new Date(pixelHistoryRedis[9]);
      pixelHistory.user = pixelHistoryRedis[7];
      pixelHistory.color = pixelHistoryRedis[5];
      history.push(pixelHistory);
    }

    return history;
  }

  private async getPixels(): Promise<Array<PixelHistoryEntity[]>> {

    let pixelHistory = new Array<PixelHistoryEntity[]>();

    let streams;
    streams = await client.execute([
      'KEYS', 'PixelHistory:*'
    ]);

    for(let i=0; i<streams.length; i++) {
      pixelHistory.push(await this.getSinglePixelStream(streams[i]));
    }

    return pixelHistory;
  }

  @Interval('pushOnMySQL', 30000)
  async pushOnMySQL() {

    const qRunner = this.dataSoucre.createQueryRunner();
    await qRunner.connect();
    await qRunner.startTransaction();

    const pixels = await this.getPixels();

    try {

      for(let i=0; i<pixels.length; i++) {
        for(let j=0; j<pixels[i].length; j++) {
          const pixel: PixelHistoryEntity = pixels[i][j];

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


  async createMap(size: number): Promise<number> {
    const qRunner = this.dataSoucre.createQueryRunner();
    await qRunner.connect();
    await qRunner.startTransaction();

    const count = await this.pixelRepo.count({});
    if(count != 0) {
      throw new HttpException('Conflict : map already exists', HttpStatus.CONFLICT);
    }
      
    try {
      for(let i=1; i<size+1; i++) {
        for(let j=1; j<size+1; j++) {
          const pixel = new PixelEntity();
          pixel.coord_x = i;
          pixel.coord_y = j;
          await qRunner.manager.save(pixel);
        }
      }
  
      await qRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await qRunner.rollbackTransaction();
      throw new HttpException('Conflict : map already exists', HttpStatus.CONFLICT);
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await qRunner.release();
    }

    return await this.pixelRepo.count({});
  }

  async increaseMapSize(newMap: UpdateGameMap): Promise<number> {
    const qRunner = this.dataSoucre.createQueryRunner();
    await qRunner.connect();
    await qRunner.startTransaction();

    let pixelArr = [];

    const count = await this.pixelRepo.count({});
    if(newMap.width**2 <= count) {
      throw new HttpException('The size of the map must be greater than the previous one', HttpStatus.CONFLICT);
    }
    if(count == 0) {
      throw new HttpException('You first need to create the map', HttpStatus.NOT_ACCEPTABLE);
    }
      
    try {
      for(let i=Math.sqrt(count)+1; i<newMap.width+1; i++) {
        for(let j=1; j<newMap.width+1; j++) {
          if(!pixelArr.includes(`${i} ${j}`)) {
            const pixel1 = new PixelEntity();
            pixel1.coord_x = i;
            pixel1.coord_y = j;
            await qRunner.manager.save(pixel1);
            pixelArr.push(`${i} ${j}`);
          }
          if(!pixelArr.includes(`${j} ${i}`)) {
            const pixel2 = new PixelEntity();
            pixel2.coord_x = j;
            pixel2.coord_y = i;
            await qRunner.manager.save(pixel2);
            pixelArr.push(`${j} ${i}`);
          }
        }
      }
  
      await qRunner.commitTransaction();
    } catch (err) {
      // since we have errors lets rollback the changes we made
      await qRunner.rollbackTransaction();
    } finally {
      // you need to release a queryRunner which was manually instantiated
      await qRunner.release();
    }

    return await this.pixelRepo.count({});
  }

}
