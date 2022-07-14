import { Body, Controller, HttpCode, Post, Put } from '@nestjs/common';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/type/role.enum';
import { SizeMap } from './dto/size-map.dto';
import { GameService } from './game.service';

@Controller('game')
export class GameController {

    constructor(private readonly gameService: GameService) {}

    @Roles(Role.ADMIN)
    @HttpCode(201)
    @Post('map')
    async createMap(@Body() query: SizeMap) {
        return await this.gameService.createMap(query);
    }

    @Roles(Role.ADMIN)
    @HttpCode(204)
    @Put('map')
    async updateMap(@Body() query: SizeMap) {
        return await this.gameService.increaseMapSize(query);
    }

}
