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
import { UserPayload } from 'src/auth/type/userpayload.type';

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
        const user: UserPayload = {
          username: placePixelDto.username,
          pscope: placePixelDto.pscope
        };
        const userId = `${user.pscope}.${user.username}`;
        const userRepo = client.fetchRepository(user_schema);
        let userRedis = await userRepo.fetch(userId);

        // Check user's point to upgrade is grade
        await this.userService.checkPoints(userRedis, sockClient);
        if (placePixelDto.isSticked) {
          userRedis.stickedPixelAvailable--;
          // await client.fetchRepository(user_schema).save(req.user);
          // this.userGateway.sendUserEvent({stickedPixels: userRedis.stickedPixelAvailable}, sockClient);
        }

        const pixel = await this.pixelService.placeSinglePixel(placePixelDto, userRedis, userRepo);

        userRedis.pixelsPlaced++;
        await userRepo.save(userRedis);

        this.server.emit('pixel', pixel);
        // client.broadcast.emit('pixel', pixel);
        return pixel;
    }
}
