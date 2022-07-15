import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelSQL } from 'src/pixel/entity/pixel-sql.entity';
import { PixelHistory } from 'src/pixel-history/entity/pixel-history.entity';
import { AuthModule } from 'src/auth/auth.module';
import { PixelModule } from 'src/pixel/pixel.module';
import { PixelService } from 'src/pixel/pixel.service';
import { PixelHistoryModule } from 'src/pixel-history/pixel-history.module';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';

@Module({
  imports: [PixelModule, PixelHistoryModule, TypeOrmModule.forFeature([PixelSQL, PixelHistory]), AuthModule],
  providers: [GameService, PixelService, PixelHistoryService],
  controllers: [GameController]
})
export class GameModule {}
