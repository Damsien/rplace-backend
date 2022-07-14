import { UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsGuard } from 'src/auth/guard/ws.guard';
import { UserPayload } from 'src/auth/type/userpayload.type';
import { PlaceSinglePixel } from './dto/place-single-pixel.dto';
import { Pixel } from './entity/pixel.entity';
import { PixelService } from './pixel.service';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class PixelGateway {

    // @WebSocketServer()
    // server: Server;

    constructor(private readonly pixelService: PixelService) {}

    @UseGuards(WsGuard)
    @SubscribeMessage('placePixel')
    async create(@MessageBody() placePixelDto: PlaceSinglePixel, @ConnectedSocket() client: Socket) {
        const pixelUser: any = placePixelDto;
        const user = {
            username: pixelUser.username,
            pscope: pixelUser.pscope
        };
        const pixel = await this.pixelService.placeSinglePixel(placePixelDto, user);
        // this.server.emit('pixel', pixel);
        client.broadcast.emit('pixel', pixel);
        return pixel;
    }

    @SubscribeMessage('getMap')
    async getMap(@ConnectedSocket() client: Socket) {
        const map = await this.pixelService.getMap();
        client.emit('map', map);
        return map;
    }

}
