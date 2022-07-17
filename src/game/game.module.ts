import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { PixelHistoryEntity } from 'src/pixel-history/entity/pixel-history.entity';
import { AuthModule } from 'src/auth/auth.module';
import { PixelModule } from 'src/pixel/pixel.module';
import { PixelService } from 'src/pixel/pixel.service';
import { PixelHistoryModule } from 'src/pixel-history/pixel-history.module';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { HttpModule } from '@nestjs/axios';
import { UserEntity } from 'src/user/entity/user.entity';

@Module({
  imports: [PixelModule, PixelHistoryModule, UserModule,
    TypeOrmModule.forFeature([PixelEntity, PixelHistoryEntity, UserEntity]), AuthModule, HttpModule],
  providers: [GameService, PixelService, PixelHistoryService, UserService],
  controllers: [GameController]
})
export class GameModule {}
