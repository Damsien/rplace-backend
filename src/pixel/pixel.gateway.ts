import { Req, UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsGuard } from 'src/auth/guard/ws.guard';
import { GameGuard } from 'src/game/guard/game.guard';
import { PlaceSinglePixel } from './dto/place-single-pixel.dto';
import { Pixel } from './entity/pixel.entity';
import { PixelService } from './pixel.service';
import { PlacePixelGuard } from './guard/place-pixel.guard';
import { client, client as redisClient } from "src/app.service";
import { logger } from 'src/main';
import { User, user_schema } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { UserGateway } from 'src/user/user.gateway';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
@UseGuards(WsGuard)
export class PixelGateway {

    @WebSocketServer()
    server: Server;

    constructor(private readonly pixelService: PixelService, private readonly userService: UserService, private readonly userGateway: UserGateway) {}

    @UseGuards(GameGuard)
    @UseGuards(PlacePixelGuard)
    @SubscribeMessage('placePixel')
    async placeSinglePixel(@Req() req, @MessageBody() placePixelDto: PlaceSinglePixel,
      @ConnectedSocket() sockClient: Socket): Promise<Pixel> {
        // Check user's point to upgrade is grade
        this.userService.checkPoints(req.user, sockClient);
        if (placePixelDto.isSticked) {
            req.user.stickedPixelAvailable--;
            await client.fetchRepository(user_schema).save(req.user);
            this.userGateway.sendUserEvent({stickedPixels: req.user.stickedPixelAvailable}, sockClient);
        }
        
        const userId = `${placePixelDto.pscope}.${placePixelDto.username}`;
        // Push on redis
        const userRepo = redisClient.fetchRepository(user_schema);
        const userRedis: User = await userRepo.fetch(userId);
        const date = new Date();
        logger.debug(`User date : ${date.getTime()}`)
        userRedis.lastPlacedPixel = date;
        await userRepo.save(userRedis);

        const pixel = await this.pixelService.placeSinglePixel(placePixelDto);
        this.server.emit('pixel', pixel);
        // client.broadcast.emit('pixel', pixel);
        return pixel;
    }
}
