import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatternShapeEntity } from 'src/pattern-shape/entity/pattern-shape-sql.entity';
import { PatternShapeModule } from 'src/pattern-shape/pattern-shape.module';
import { PatternShapeService } from 'src/pattern-shape/pattern-shape.service';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { PatternEntity } from './entity/pattern-sql.entity';
import { PatternController } from './pattern.controller';
import { PatternService } from './pattern.service';

@Module({
  controllers: [PatternController],
  providers: [PatternService, PatternShapeService],
  imports: [
    PatternShapeModule,
    TypeOrmModule.forFeature([PatternEntity, PatternShapeEntity, PixelEntity])
  ]
})
export class PatternModule {}
