import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Param, Post, Query, UseGuards, Request } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { logger } from 'src/main';
import { GetSinglePixel } from './dto/get-single-pixel.dto';
import { PlaceSinglePixel } from './dto/place-single-pixel.dto';
import { Pixel } from './entity/pixel.entity';
import { PixelService } from './pixel.service';

@Controller('pixel')
export class PixelController {

    constructor(private readonly pixelService: PixelService) {}

    @Get('map')
    async getPixels(): Promise<Pixel[]> {
        let pixels = await this.pixelService.getMap();
        
        return pixels;
    }

    @Get()
    async getPixel(@Query() query: GetSinglePixel): Promise<Pixel> {
        let pixel = await this.pixelService.getSinglePixel(query);
        if(pixel == null) {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        }
        return pixel;
    }

    @UseGuards(AtAuthGuard)
    @Post()
    async placePixel(@Request() req, @Body() query: PlaceSinglePixel): Promise<Pixel> {
        let pixel = await this.pixelService.placeSinglePixel(query, req.user);
        if(pixel == null) {
            throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return pixel;
    }

    @UseGuards(AtAuthGuard)
    @HttpCode(201)
    @Post('create-map')
    async createMap() {
        return await this.pixelService.createMap();
    }

}
