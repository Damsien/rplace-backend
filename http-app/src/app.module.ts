import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PixelModule } from './pixel/pixel.module';

@Module({
  imports: [PixelModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
