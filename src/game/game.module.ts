import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { PixelHistoryModule } from 'src/pixel-history/pixel-history.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelSQL } from 'src/pixel/entity/pixel-sql.entity';
import { PixelHistory } from 'src/pixel-history/entity/pixel-history.entity';
import { AuthModule } from 'src/auth/auth.module';
import { RolesGuard } from 'src/user/guard/roles.guard';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';

@Module({
  imports: [PixelHistoryModule, TypeOrmModule.forFeature([PixelSQL, PixelHistory]), AuthModule],
  providers: [GameService, PixelHistoryService,
    {
      provide: 'AT',
      useClass: AtAuthGuard
    },
    {
      provide: 'ROLES',
      useClass: RolesGuard
    }
  ],
  controllers: [GameController]
})
export class GameModule {}
