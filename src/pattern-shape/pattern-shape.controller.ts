import { Body, Controller, Request, Put, UseGuards, Delete, HttpCode, Query, Param, Req, GoneException } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { GameGuard } from 'src/game/guard/game.guard';
import { PlacePatternPixel } from './dto/place-pattern-pixel.dto';
import { RemovePatternPixel } from './dto/remove-pattern-pixel.dto';
import { PatternShapeGuard } from './guard/pattern-shape-guard.guard';
import { PatternShapeService } from './pattern-shape.service';

@UseGuards(PatternShapeGuard)
@UseGuards(GameGuard)
@UseGuards(AtAuthGuard)
@Controller('pattern-shape')
export class PatternShapeController {

    constructor(
        private readonly patternShapeService: PatternShapeService
    ) {}

    @HttpCode(200)
    @Put('place/:patternId')
    placePixel(@Param('patternId') patternId: string, @Body() pixel: PlacePatternPixel) {
        pixel.patternId = patternId;
        try {
            this.patternShapeService.place(pixel);
        } catch (err) {
            throw new GoneException();
        }
    }

    @HttpCode(200)
    @Delete('remove/:patternId')
    removePixel(@Param('patternId') patternId: string, @Query() pixel: RemovePatternPixel) {
        pixel.patternId = patternId;
        this.patternShapeService.remove(pixel);
    }

}
