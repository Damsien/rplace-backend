import { Body, Controller, Request, Put, UseGuards, Delete, HttpCode, Query } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { GameGuard } from 'src/game/guard/game.guard';
import { PlacePatternPixel } from './dto/place-pattern-pixel.dto';
import { RemovePatternPixel } from './dto/remove-pattern-pixel.dto';
import { PatternShapeService } from './pattern-shape.service';

@UseGuards(GameGuard)
@UseGuards(AtAuthGuard)
@Controller('pattern-shape')
export class PatternShapeController {

    constructor(
        private readonly patternShapeService: PatternShapeService
    ) {}

    @HttpCode(200)
    @Put('place')
    placePixel(@Body() pixel: PlacePatternPixel) {
        this.patternShapeService.place(pixel);
    }

    @HttpCode(200)
    @Delete('remove')
    removePixel(@Query() pixel: RemovePatternPixel) {
        this.patternShapeService.remove(pixel);
    }

}
