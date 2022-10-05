import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({
    cors: {
      origin: '*'
    }
  })
export class UserGateway {

    @WebSocketServer()
    server: Server;

    constructor() {}

    async sendUserEvent(event) {
        this.server.emit('user', event);
    }

}
  