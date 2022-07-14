import { Controller, Get, HttpException, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { logger } from 'src/main';
import { GetSinglePixel } from './dto/get-single-pixel.dto';
import { PlaceSinglePixel } from './dto/place-single-pixel.dto';
import { Pixel } from './entity/pixel.entity';
import { PixelService } from './pixel.service';

@Controller('pixel')
export class PixelController {

    constructor(private readonly pixelService: PixelService) {}

    @UseGuards(AtAuthGuard)
    @Get(':map')
    async getPixels(@Param('map') map: string): Promise<Pixel[]> {
        if (map != "map") {
            throw new HttpException('Bad Request Error', HttpStatus.BAD_REQUEST);
        }
        let pixels = await this.pixelService.getMap();
        
        return pixels;
    }

    @UseGuards(AtAuthGuard)
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
    async placePixel(@Query() query: PlaceSinglePixel): Promise<Pixel> {
        let pixel = await this.pixelService.placeSinglePixel(query);
        if(pixel == null) {
            throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return pixel;
    }

    @UseGuards(AtAuthGuard)
    @Post('create-map')
    async createMap() {
        return await this.pixelService.createMap();
    }

}
