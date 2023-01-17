import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Socket, Server } from "socket.io";

@WebSocketGateway({
    cors: {
      origin: '*'
    }
  })
export class UserGateway {

    @WebSocketServer()
    server: Server;

    constructor() {}

    async sendUserEvent(event, client: Socket) {
      client.emit('user', event);
    }

    async sendGameEvent(event) {
        this.server.emit('game', event);
    }

}
  