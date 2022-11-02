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
import { UserEntity } from 'src/user/entity/user-sql.entity';
import { UserGateway } from 'src/user/user.gateway';
import { GroupEntity } from 'src/user/entity/group-sql.entity';

@Module({
  imports: [PixelModule, PixelHistoryModule, UserModule,
    TypeOrmModule.forFeature([PixelEntity, PixelHistoryEntity, UserEntity, GroupEntity]), AuthModule, HttpModule],
  providers: [GameService, PixelService, PixelHistoryService, UserService, UserGateway],
  controllers: [GameController]
})
export class GameModule {}
