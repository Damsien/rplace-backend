import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { PixelHistory } from 'src/pixel-history/entity/pixel-history.entity';
import { PixelHistoryModule } from 'src/pixel-history/pixel-history.module';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { PixelSQL } from './entity/pixel-sql.entity';
import { PixelController } from './pixel.controller';
import { PixelGateway } from './pixel.gateway';
import { PixelService } from './pixel.service';

@Module({
  imports: [PixelHistoryModule, TypeOrmModule.forFeature([PixelSQL, PixelHistory]), AuthModule],
  controllers: [PixelController],
  providers: [PixelService, PixelHistoryService, PixelGateway]
})
export class PixelModule {}
