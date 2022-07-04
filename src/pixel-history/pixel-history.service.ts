import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { client } from 'src/app.service';
import { PlaceSinglePixel } from 'src/pixel/dto/place-single-pixel.dto';
import { DataSource, Repository } from 'typeorm';
import { PixelHistory } from './entity/pixel-history.entity';

@Injectable()
export class PixelHistoryService {
  
  constructor(private dataSoucre: DataSource,
    @InjectRepository(PixelHistory) private repo: Repository<PixelHistory>) {}

  async placeSinglePixel(pxl: PlaceSinglePixel) {
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

  @Interval('pushOnMySQL', 30000)
  async pushOnMySQL() {
    const qRunner = this.dataSoucre.createQueryRunner();
    await qRunner.connect();

    await qRunner.startTransaction();

    try {
      await qRunner.manager.save(async manager => {
        await manager.save('object');
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
