import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelModule } from 'src/pixel/pixel.module';
import { PixelService } from 'src/pixel/pixel.service';
import { EventEntity } from './entity/event.entity';
import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [PixelModule, TypeOrmModule.forFeature([EventEntity])],
  controllers: [EventController],
  providers: [EventService, PixelService]
})
export class EventModule {}
