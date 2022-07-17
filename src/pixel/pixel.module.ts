import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { GameGuard } from 'src/game/guard/game.guard';
import { PixelHistoryEntity } from 'src/pixel-history/entity/pixel-history.entity';
import { PixelHistoryModule } from 'src/pixel-history/pixel-history.module';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { PixelEntity } from './entity/pixel-sql.entity';
import { PixelController } from './pixel.controller';
import { PixelGateway } from './pixel.gateway';
import { PixelService } from './pixel.service';

@Module({
  imports: [
    PixelHistoryModule,
    TypeOrmModule.forFeature([PixelEntity, PixelHistoryEntity])
  ],
  controllers: [PixelController],
  providers: [PixelService, PixelHistoryService, PixelGateway]
})
export class PixelModule {}
