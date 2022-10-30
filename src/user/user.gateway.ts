import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Socket } from "socket.io";

@WebSocketGateway({
    cors: {
      origin: '*'
    }
  })
export class UserGateway {

    constructor() {}

    async sendUserEvent(event, client: Socket) {
      client.emit('user', event);
    }

}
  