import { Body, Controller, Request, Get, Param, Post, UseGuards, HttpCode } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { GameGuard } from 'src/game/guard/game.guard';
import { PatternShapeEntity } from 'src/pattern-shape/entity/pattern-shape-sql.entity';
import { CreatePattern } from './dto/create-pattern.dto';
import { PatternEntity } from './entity/pattern-sql.entity';
import { PatternService } from './pattern.service';

@UseGuards(GameGuard)
@UseGuards(AtAuthGuard)
@Controller('pattern')
export class PatternController {

    constructor(
        private readonly patternService: PatternService
    ) {}

    @Get('/all')
    getAllUserPatterns(@Request() req): Promise<PatternEntity[]> {
        const userId = `${req.user.pscope}.${req.user.username}`;
        return this.patternService.getAllUserPatterns(userId);
    }

    @Get('/:id')
    getPattern(@Param() params): Promise<PatternShapeEntity[]> {
        return this.patternService.getPattern(params.id);
    }

    @HttpCode(200)
    @Post()
    async createPattern(@Request() req, @Body() createPatternDto: CreatePattern) {
        const userId = `${req.user.pscope}.${req.user.username}`;
        await this.patternService.createPattern(userId, createPatternDto.patternName);
    }

}
