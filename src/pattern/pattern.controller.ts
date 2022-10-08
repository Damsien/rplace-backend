import { Body, Controller, Request, Get, Param, Post, UseGuards, HttpCode, Delete } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { GameGuard } from 'src/game/guard/game.guard';
import { logger } from 'src/main';
import { PatternShapeEntity } from 'src/pattern-shape/entity/pattern-shape-sql.entity';
import { CreatePattern } from './dto/create-pattern.dto';
import { PatternShape } from './dto/pattern-shape.dto';
import { Pattern } from './dto/pattern.dto';
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
    getAllUserPatterns(@Request() req): Promise<Pattern[]> {
        const userId = `${req.user.pscope}.${req.user.username}`;
        return this.patternService.getAllUserPatterns(userId);
    }

    @Get('/:id')
    getPattern(@Param() params): Promise<PatternShape[]> {
        return this.patternService.getPattern(params.id);
    }

    @HttpCode(201)
    @Post()
    async createPattern(@Request() req, @Body() createPatternDto: CreatePattern) {
        const userId = `${req.user.pscope}.${req.user.username}`;
        return await this.patternService.createPattern(userId, createPatternDto.patternName);
    }

    @Delete('/:id')
    async deletePattern(@Request() req, @Param() params) {
        await this.patternService.deletePattern(params.id);
    }

}
