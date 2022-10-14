import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { logger } from 'src/main';
import { PatternShapeService } from 'src/pattern-shape/pattern-shape.service';
import { DataSource, Repository } from 'typeorm';
import { PatternShape } from './dto/pattern-shape.dto';
import { Pattern } from './type/pattern.type';
import { PatternBindEntity } from './entity/pattern-bind-sql.entity';
import { PatternEntity } from './entity/pattern-sql.entity';
import { AllPatterns } from './type/all-patterns.type';

@Injectable()
export class PatternService {

    constructor(
        private dataSource: DataSource,
        private readonly patternShapeService: PatternShapeService,
        @InjectRepository(PatternEntity) private patternRepo: Repository<PatternEntity>,
        @InjectRepository(PatternBindEntity) private patternBindRepo: Repository<PatternBindEntity>
    ) {}


    async createPattern(userId: string, name: string): Promise<any> {
        const pattern = new PatternEntity();
        pattern.userId = userId;
        pattern.name = name;
        const regex = /^[^\/|^\n]+$/;
        if (name.match(regex)) {
            const entity = await this.patternRepo.insert(pattern);
            return entity.identifiers[0];
        } else {
            throw new BadRequestException();
        }
    }

    async deletePattern(patternId: string, userId: string): Promise<Pattern> {
        const pattern = await this.patternRepo.findOneBy({patternId: patternId});
        if (pattern.userId == userId) {
            await this.patternRepo.remove(pattern);
        } else {
            const patternBind = await this.patternBindRepo.findOneBy({patternId: patternId, userId: userId});
            await this.patternBindRepo.remove(patternBind);
        }
        return {
            patternId: pattern.patternId,
            name: pattern.name,
            userId: pattern.userId
        };
    }

    async getAllUserPatterns(userId: string): Promise<AllPatterns> {
        const selfEntities = await this.patternRepo.findBy({userId: userId});
        const self: Pattern[] = [];
        for (let pattern of selfEntities) {
            self.push({
                patternId: pattern.patternId,
                name: pattern.name,
                userId: pattern.userId
            });
        }

        // const bindEntities = await this.dataSource.manager
        //     .createQueryBuilder(PatternEntity, 'p')
        //     .leftJoinAndSelect(PatternBindEntity, 'pb')
        //     .where('pb.userId = :userId', { userId: userId })
        //     .where('p.patternId = pb.patternId')
        //     .getMany();
        const bindEntities = await this.dataSource.query(`
            SELECT * FROM pattern_entity 
            INNER JOIN pattern_bind_entity ON pattern_entity.patternId = pattern_bind_entity.patternId 
            WHERE pattern_bind_entity.userId = "${userId}";
        `);
        const bind: Pattern[] = [];
        for (let pattern of bindEntities) {
            bind.push({
                patternId: pattern.patternId,
                name: pattern.name,
                userId: pattern.userId
            });
        }

        return {
            'self': self,
            'bind': bind
        };
    }

    async getPattern(id: string, userId: string): Promise<PatternShape[]> {
        try {
            if ((await this.patternRepo.findOneBy({patternId: id})).userId != userId) {
                const patternBind = new PatternBindEntity();
                patternBind.patternId = id;
                patternBind.userId = userId;
                await this.patternBindRepo.insert(patternBind);
            }
        } catch (err) {
            logger.debug(err);
        }
        return await this.patternShapeService.getPatternShape(id);
    }

}
