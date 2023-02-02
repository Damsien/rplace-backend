import { Body, Controller, Get, HttpCode, Param, Post, Put, Req, Request, Response, UseGuards } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { UserComplete } from 'src/auth/type/usercomplete.type';
import { UserPayload } from 'src/auth/type/userpayload.type';
import { GameService } from 'src/game/game.service';
import { GameGuard } from 'src/game/guard/game.guard';
import { StartGameGuard } from 'src/game/guard/start-game.guard';
import { Roles } from './decorator/roles.decorator';
import { Group } from './dto/Group.dto';
import { RolesGuard } from './guard/roles.guard';
import { Role } from './type/role.enum';
import { UserService } from './user.service';

@UseGuards(AtAuthGuard)
@Controller('user')
export class UserController {

    constructor(private readonly gameService: GameService, private readonly userService: UserService) {}

    @HttpCode(200)
    @UseGuards(StartGameGuard)
    @Get('/other/:id')
    getOtherUserSpec(@Param('id') id: string) {
        const user: UserPayload = {
          pscope: id.split('-')[0],
          username: id.split('-')[1],
        };
        return this.gameService.getUserGame(user);
    }

    @HttpCode(200)
    @UseGuards(StartGameGuard)
    @Get('/spec')
    getUserGameSpec(@Request() req) {
        return this.gameService.getUserGame(req.user);
    }

    @HttpCode(200)
    @UseGuards(StartGameGuard)
    @Get('/username')
    getUsername(@Request() req) {
        return {pscope: req.user.pscope, username: req.user.username};
    }
    
    @HttpCode(200)
    @UseGuards(StartGameGuard)
    @Get('game/all')
    getAllGame(@Request() req) {
        return this.gameService.getUserGameMap(req.user);
    }
    
    @HttpCode(200)
    @UseGuards(StartGameGuard)
    @Get('game/map')
    getMapOnly(@Request() req) {
        return this.gameService.getMapOnly();
    }

    @HttpCode(200)
    @UseGuards(StartGameGuard)
    @Get('game/spec')
    getAllGameSpec() {
        return this.gameService.getGlobalGameSpec();
    }

    @HttpCode(201)
    // @UseGuards(GameGuard)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Post('create')
    createUser(@Body() user: UserComplete) {
        this.userService.createUserIfNotExists(user);
    }

    @HttpCode(201)
    // @UseGuards(GameGuard)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Post('group/create')
    createGroup(@Body() group: Group) {
        this.userService.createGroup(group);
    }

    @HttpCode(200)
    @UseGuards(GameGuard)
    @Put('group/link')
    linkGroup(@Req() req, @Body() group: Group) {
        return this.userService.linkGroup(req.user, group);
    }

    @HttpCode(200)
    @UseGuards(StartGameGuard)
    @Get('groups')
    getGroups(@Req() req) {
        return this.userService.getGroups();
    }


    @HttpCode(200)
    @Get('game-state')
    async hasTheGameStarted() {
        const state = await this.gameService.getGameState();
        return {state: state};
    }

}
