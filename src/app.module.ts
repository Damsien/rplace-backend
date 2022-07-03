import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PixelModule } from './pixel/pixel.module';
import { PixelHistoryService } from './pixel-history/pixel-history.service';
import { UserPixelHistoryService } from './user-pixel-history/user-pixel-history.service';

@Module({
  imports: [PixelModule],
  controllers: [AppController],
  providers: [AppService, PixelHistoryService, UserPixelHistoryService],
})
export class AppModule {}
