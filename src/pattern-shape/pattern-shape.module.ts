import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from 'src/game/game.service';
import { PatternBindEntity } from 'src/pattern/entity/pattern-bind-sql.entity';
import { PatternEntity } from 'src/pattern/entity/pattern-sql.entity';
import { PatternService } from 'src/pattern/pattern.service';
import { PixelHistoryEntity } from 'src/pixel-history/entity/pixel-history.entity';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { PixelService } from 'src/pixel/pixel.service';
import { UserEntity } from 'src/user/entity/user-sql.entity';
import { UserGateway } from 'src/user/user.gateway';
import { UserService } from 'src/user/user.service';
import { PatternShapeEntity } from './entity/pattern-shape-sql.entity';
import { PatternShapeController } from './pattern-shape.controller';
import { PatternShapeService } from './pattern-shape.service';

@Module({
  controllers: [PatternShapeController],
  providers: [PatternShapeService, GameService, PixelService, UserService, PixelHistoryService, UserGateway, PatternService],
  imports: [
    TypeOrmModule.forFeature([PatternShapeEntity, PixelEntity, UserEntity, PixelEntity, PixelHistoryEntity, PatternEntity, PatternBindEntity]),
    HttpModule
  ]
})
export class PatternShapeModule {}
