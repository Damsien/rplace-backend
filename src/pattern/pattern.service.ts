import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PatternShapeService } from 'src/pattern-shape/pattern-shape.service';
import { Repository } from 'typeorm';
import { PatternShape } from './dto/pattern-shape.dto';
import { Pattern } from './dto/pattern.dto';
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
        return await this.patternRepo.insert(pattern);
    }

    async deletePattern(patternId: number) {
        const pattern = await this.patternRepo.findOneBy({patternId: patternId});
        await await this.patternRepo.delete(pattern);
    }

    async getAllUserPatterns(userId: string): Promise<Pattern[]> {
        const patternEntities = await this.patternRepo.findBy({userId: userId});
        const patterns: Pattern[] = [];
        for (let pattern of patternEntities) {
            patterns.push({
                patternId: pattern.patternId,
                name: pattern.name,
                userId: pattern.userId
            });
        }
        return patterns;
    }

    async getPattern(id: number): Promise<PatternShape[]> {
        return await this.patternShapeService.getPatternShape(id);
    }

}
