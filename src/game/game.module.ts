import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelSQL } from 'src/pixel/entity/pixel-sql.entity';
import { PixelHistory } from 'src/pixel-history/entity/pixel-history.entity';
import { AuthModule } from 'src/auth/auth.module';
import { RolesGuard } from 'src/user/guard/roles.guard';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { PixelModule } from 'src/pixel/pixel.module';
import { PixelService } from 'src/pixel/pixel.service';

@Module({
  imports: [PixelModule, TypeOrmModule.forFeature([PixelSQL, PixelHistory]), AuthModule],
  providers: [GameService, PixelService,
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
