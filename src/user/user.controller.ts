import { Body, Controller, Get, HttpCode, Param, Post, Put, Req, Request, UseGuards } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { UserComplete } from 'src/auth/type/usercomplete.type';
import { UserPayload } from 'src/auth/type/userpayload.type';
import { GameService } from 'src/game/game.service';
import { GameGuard } from 'src/game/guard/game.guard';
import { Roles } from './decorator/roles.decorator';
import { Group } from './dto/Group.dto';
import { Role } from './type/role.enum';
import { UserService } from './user.service';

@UseGuards(GameGuard)
@UseGuards(AtAuthGuard)
@Controller('user')
export class UserController {

    constructor(private readonly gameService: GameService, private readonly userService: UserService) {}

    @HttpCode(200)
    @Get('/other/:id')
    getOtherUserSpec(@Param('id') id: string) {
        const user: UserPayload = {
          pscope: id.split('-')[0],
          username: id.split('-')[1],
        };
        return this.gameService.getUserGame(user);
    }

    @HttpCode(200)
    @Get('/spec')
    getUserGameSpec(@Request() req) {
        return this.gameService.getUserGame(req.user);
    }

    @HttpCode(200)
    @Get('/username')
    getUsername(@Request() req) {
        return {pscope: req.user.pscope, username: req.user.username};
    }
    
    @HttpCode(200)
    @Get('game/all')
    getAllGame(@Request() req) {
        return this.gameService.getUserGameMap(req.user);
    }

    @HttpCode(200)
    @Get('game/spec')
    getAllGameSpec() {
        return this.gameService.getGlobalGameSpec();
    }

    @HttpCode(200)
    @Roles(Role.ADMIN)
    @Post('create')
    createUser(@Body() user: UserComplete) {
        this.userService.createUserIfNotExists(user);
    }

    @HttpCode(200)
    @Roles(Role.ADMIN)
    @Post('group/create')
    createGroup(@Body() group: Group) {
        this.userService.createGroup(group);
    }

    @HttpCode(200)
    @Put('group')
    linkGroup(@Req() req, @Body() group: Group) {
        return this.userService.linkGroup(req.user, group);
    }

}
