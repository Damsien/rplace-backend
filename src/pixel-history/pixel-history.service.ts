import { ConflictException, HttpCode, HttpException, HttpStatus, Inject, Injectable, NotAcceptableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { client } from 'src/app.service';
import { UpdateGameMap } from 'src/event/dto/update-game-map.dto';
import { StartGame } from 'src/game/dto/start-game.dto';
import { Game, game_schema } from 'src/game/entity/game.entity';
import { logger } from 'src/main';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { Pixel } from 'src/pixel/entity/pixel.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Repository as RedisRepository } from 'redis-om';
import { PixelHistoryEntity } from './entity/pixel-history.entity';

@Injectable()
export class PixelHistoryService {
  
  private gameRepo: RedisRepository<Game>;

  constructor(
    private dataSource: DataSource,
    @InjectRepository(PixelHistoryEntity) private pixelHistoRepo: Repository<PixelHistoryEntity>,
    @InjectRepository(PixelEntity) private pixelRepo: Repository<PixelEntity>
  ) {}


  async getLastPixelOfUser(userId: string): Promise<PixelHistoryEntity> {
    const pixels = await this.pixelHistoRepo.findBy({userId: userId});
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
      'date', pxl.date.toString(),
      'isSticked', pxl.isSticked.toString()
    ]);
  }


  async createMap(size: number): Promise<number> {
    const qRunner = this.dataSource.createQueryRunner();
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
    const qRunner = this.dataSource.createQueryRunner();
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

    return count;
  }

}
