import { UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsGuard } from 'src/auth/guard/ws.guard';
import { GameGuard } from 'src/game/guard/game.guard';
import { PlaceSinglePixel } from './dto/place-single-pixel.dto';
import { Pixel } from './entity/pixel.entity';
import { PixelService } from './pixel.service';
import { PlacePixelGuard } from './guard/place-pixel.guard';
import { client as redisClient } from "src/app.service";
import { logger } from 'src/main';
import { User, user_schema } from 'src/user/entity/user.entity';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
@UseGuards(GameGuard)
@UseGuards(WsGuard)
export class PixelGateway {

    @WebSocketServer()
    server: Server;

    constructor(private readonly pixelService: PixelService) {}

    @UseGuards(PlacePixelGuard)
    @SubscribeMessage('placePixel')
    async placeSinglePixel(@MessageBody() placePixelDto: PlaceSinglePixel,
      @ConnectedSocket() client: Socket): Promise<Pixel> {
        
        const userId = `${placePixelDto.pscope}.${placePixelDto.username}`;
        // Push on redis
        const userRepo = redisClient.fetchRepository(user_schema);
        const userRedis: User = await userRepo.fetch(userId);
        userRedis.lastPlacedPixel = new Date();
        await userRepo.save(userRedis);

        const pixel = await this.pixelService.placeSinglePixel(placePixelDto);
        this.server.emit('pixel', pixel);
        // client.broadcast.emit('pixel', pixel);
        return pixel;
    }

}
