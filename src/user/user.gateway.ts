import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
      origin: '*'
    }
  })
export class UserGateway {

    @WebSocketServer()
    server: Server;

    constructor() {}

    async sendUserEvent(client: Socket, event) {
        client.emit('user', event);
    }

}
  