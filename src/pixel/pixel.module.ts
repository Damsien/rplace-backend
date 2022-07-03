import { Module } from '@nestjs/common';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { UserPixelHistoryService } from 'src/user-pixel-history/user-pixel-history.service';
import { PixelController } from './pixel.controller';
import { PixelService } from './pixel.service';

@Module({
  controllers: [PixelController],
  providers: [PixelService, PixelHistoryService, UserPixelHistoryService]
})
export class PixelModule {}
