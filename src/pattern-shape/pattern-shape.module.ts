import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { PatternShapeEntity } from './entity/pattern-shape-sql.entity';
import { PatternShapeController } from './pattern-shape.controller';
import { PatternShapeService } from './pattern-shape.service';

@Module({
  controllers: [PatternShapeController],
  providers: [PatternShapeService],
  imports: [
    TypeOrmModule.forFeature([PatternShapeEntity, PixelEntity]),
  ]
})
export class PatternShapeModule {}
