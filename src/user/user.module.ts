import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user-sql.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { GameService } from 'src/game/game.service';
import { PixelModule } from 'src/pixel/pixel.module';
import { PixelService } from 'src/pixel/pixel.service';
import { PixelHistoryEntity } from 'src/pixel-history/entity/pixel-history.entity';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { UserGateway } from './user.gateway';
import { GroupEntity } from './entity/group-sql.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity, PixelEntity, PixelHistoryEntity, GroupEntity]),
    forwardRef(() => PixelModule)
  ],
  providers: [PixelService, UserService, GameService, PixelHistoryService, UserGateway],
  exports: [UserService],
  controllers: [UserController]
})
export class UserModule {}
