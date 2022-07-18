import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuppeteerModule } from 'nest-puppeteer';
import { UserEntity } from './entity/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { GameService } from 'src/game/game.service';
import { PixelModule } from 'src/pixel/pixel.module';
import { PixelService } from 'src/pixel/pixel.service';
import { PixelHistoryEntity } from 'src/pixel-history/entity/pixel-history.entity';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';

@Module({
  imports: [
    PuppeteerModule.forRoot({ pipe: true }),
    HttpModule,
    TypeOrmModule.forFeature([UserEntity, PixelEntity, PixelHistoryEntity]),
    forwardRef(() => PixelModule)
  ],
  providers: [PixelService, UserService, GameService, PixelHistoryService],
  exports: [UserService],
  controllers: [UserController]
})
export class UserModule {}
