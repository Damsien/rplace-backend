import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatternShape } from 'src/pattern/dto/pattern-shape.dto';
import { PixelEntity } from 'src/pixel/entity/pixel-sql.entity';
import { Repository } from 'typeorm';
import { PlacePatternPixel } from './dto/place-pattern-pixel.dto';
import { RemovePatternPixel } from './dto/remove-pattern-pixel.dto';
import { PatternShapeEntity } from './entity/pattern-shape-sql.entity';

@Injectable()
export class PatternShapeService {

    constructor(
        @InjectRepository(PatternShapeEntity) private patternShapeRepo: Repository<PatternShapeEntity>,
        @InjectRepository(PixelEntity) private pixelRepo: Repository<PixelEntity>
    ) {}


    async getPatternShape(patternId: number): Promise<PatternShape[]> {
        const patternShapesEntity = await this.patternShapeRepo.findBy({patternId: patternId});
        const patternShapes: PatternShape[] = [];
        let coord_x;
        let coord_y;
        let pixel: PixelEntity;
        for (let pattern of patternShapesEntity) {
            pixel = await this.pixelRepo.findOneBy({pixelId: pattern.pixelId});
            coord_x = pixel.coord_x;
            coord_y = pixel.coord_y;
            patternShapes.push({
                patternId: pattern.patternId,
                patternShapeId: pattern.patternShapeId,
                color: pattern.color,
                coord_x: coord_x,
                coord_y: coord_y
            });
        }
        return patternShapes;
    }

    async place(pixel: PlacePatternPixel) {
        const shape = new PatternShapeEntity();
        shape.color = pixel.color;
        shape.patternId = pixel.patternId;
        shape.pixelId = (await this.pixelRepo
            .findOneBy({coord_x: pixel.coord_x, coord_y: pixel.coord_y}))
            .pixelId;
        await this.patternShapeRepo.insert(shape);
    }

    async remove(pixel: RemovePatternPixel) {
        const pixelId = (await this.pixelRepo
            .findOneBy({coord_x: pixel.coord_x, coord_y: pixel.coord_y}))
            .pixelId;
        await this.patternShapeRepo.delete({patternId: pixel.patternId, pixelId: pixelId});
    }

}
