import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelHistoryEntity } from 'src/pixel-history/entity/pixel-history.entity';
import { PixelHistoryModule } from 'src/pixel-history/pixel-history.module';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { PixelModule } from 'src/pixel/pixel.module';
import { PixelService } from 'src/pixel/pixel.service';
import { RunnerModule } from 'src/runner/runner.module';
import { RunnerService } from 'src/runner/runner.service';
import { EventEntity } from './entity/event.entity';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [PixelModule, TypeOrmModule.forFeature([EventEntity, PixelEntity, PixelHistoryEntity]), PixelHistoryModule, RunnerModule],
  controllers: [EventController],
  providers: [EventService, PixelService, PixelHistoryService, RunnerService]
})
export class EventModule {}
