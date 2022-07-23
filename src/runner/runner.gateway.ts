import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({
    cors: {
      origin: '*'
    }
  })
export class RunnerGateway {

    @WebSocketServer()
    server: Server;

    constructor() {}

    async sendGameEvent(event) {
        this.server.emit('game', event);
    }

}
  