import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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


    async getPatternShape(patternId: number): Promise<PatternShapeEntity[]> {
        return this.patternShapeRepo.findBy({patternId: patternId});
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
