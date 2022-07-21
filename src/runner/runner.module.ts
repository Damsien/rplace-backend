import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from 'src/event/entity/event.entity';
import { PixelHistoryEntity } from 'src/pixel-history/entity/pixel-history.entity';
import { PixelHistoryModule } from 'src/pixel-history/pixel-history.module';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { PixelModule } from 'src/pixel/pixel.module';
import { PixelService } from 'src/pixel/pixel.service';
import { RunnerService } from './runner.service';

@Module({
  imports: [PixelModule, PixelHistoryModule, TypeOrmModule.forFeature([EventEntity, PixelEntity, PixelHistoryEntity])],
  providers: [RunnerService, PixelService, PixelHistoryService]
})
export class RunnerModule {}
