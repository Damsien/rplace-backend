import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatternShapeService } from 'src/pattern-shape/pattern-shape.service';
import { Repository } from 'typeorm';
import { PatternEntity } from './entity/pattern-sql.entity';

@Injectable()
export class PatternService {

    constructor(
        private readonly patternShapeService: PatternShapeService,
        @InjectRepository(PatternEntity) private patternRepo: Repository<PatternEntity>,
    ) {}


    async createPattern(userId: string, name: string) {
        const pattern = new PatternEntity();
        pattern.userId = userId;
        pattern.name = name;
        await this.patternRepo.insert(pattern);
    }

    async getAllUserPatterns(userId: string): Promise<PatternEntity[]> {
        return this.patternRepo.findBy({userId: userId});
    }

    async getPattern(id: number) {
        return this.patternShapeService.getPatternShape(id);
    }

}
