import { Controller, Get, HttpException, HttpStatus, Param, Query } from '@nestjs/common';
import { logger } from 'src/main';
import { GetSinglePixel } from './dto/get-single-pixel.dto';
import { Pixel } from './interfaces/pixel.interface';
import { PixelService } from './pixel.service';

@Controller('pixel')
export class PixelController {

    constructor(private readonly pixelService: PixelService) {}

    @Get(':map')
    async getPixels(@Param('map') map: string): Promise<Pixel[]> {
        if (map != "map") {
            throw new HttpException('Bad Request Error', HttpStatus.BAD_REQUEST);
        }
        let pixels = await this.pixelService.getMap();
        
        return pixels;
    }

    @Get()
    async getPixel(@Query() query: GetSinglePixel) {
        let pixel = await this.pixelService.getSinglePixel(query);
        if(pixel == null) {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        }
        return pixel;
    }

}
