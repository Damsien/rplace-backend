import { Body, Controller, Request, Get, Param, Post, UseGuards, HttpCode, Delete } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { GameGuard } from 'src/game/guard/game.guard';
import { logger } from 'src/main';
import { PatternShapeEntity } from 'src/pattern-shape/entity/pattern-shape-sql.entity';
import { CreatePattern } from './dto/create-pattern.dto';
import { PatternShape } from './dto/pattern-shape.dto';
import { PatternEntity } from './entity/pattern-sql.entity';
import { PatternService } from './pattern.service';
import { AllPatterns } from './type/all-patterns.type';
import { Pattern } from './type/pattern.type';

@UseGuards(AtAuthGuard)
@Controller('pattern')
export class PatternController {

    constructor(
        private readonly patternService: PatternService
    ) {}

    @Get('/all')
    getAllUserPatterns(@Request() req): Promise<AllPatterns> {
        const userId = `${req.user.pscope}.${req.user.username}`;
        return this.patternService.getAllUserPatterns(userId);
    }

    @Get('/:id')
    getPattern(@Request() req, @Param() params): Promise<PatternShape[]> {
        const userId = `${req.user.pscope}.${req.user.username}`;
        return this.patternService.getPattern(params.id, userId);
    }

    @UseGuards(GameGuard)
    @HttpCode(201)
    @Post()
    async createPattern(@Request() req, @Body() createPatternDto: CreatePattern): Promise<any> {
        const userId = `${req.user.pscope}.${req.user.username}`;
        return await this.patternService.createPattern(userId, createPatternDto.patternName);
    }

    @UseGuards(GameGuard)
    @HttpCode(200)
    @Delete('/:id')
    deletePattern(@Request() req, @Param() params): Promise<Pattern> {
        const userId = `${req.user.pscope}.${req.user.username}`;
        return this.patternService.deletePattern(params.id, userId);
    }

}
