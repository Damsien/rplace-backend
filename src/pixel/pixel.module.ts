import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { GameService } from 'src/game/game.service';
import { GameGuard } from 'src/game/guard/game.guard';
import { PixelHistoryEntity } from 'src/pixel-history/entity/pixel-history.entity';
import { PixelHistoryModule } from 'src/pixel-history/pixel-history.module';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { UserEntity } from 'src/user/entity/user-sql.entity';
import { UserGateway } from 'src/user/user.gateway';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { PixelEntity } from './entity/pixel-sql.entity';
import { PixelController } from './pixel.controller';
import { PixelGateway } from './pixel.gateway';
import { PixelService } from './pixel.service';

@Module({
  imports: [
    PixelHistoryModule,
    HttpModule,
    TypeOrmModule.forFeature([PixelEntity, PixelHistoryEntity, UserEntity]),
    AuthModule,
    UserModule
  ],
  controllers: [PixelController],
  providers: [PixelService, PixelHistoryService, PixelGateway, AuthService, UserService, JwtService, GameService, UserGateway]
})
export class PixelModule {}
