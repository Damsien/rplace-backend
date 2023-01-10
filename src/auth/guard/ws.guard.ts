import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { logger } from "src/main";
import { AuthService } from "../auth.service";

@Injectable()
export class WsGuard implements CanActivate {

    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const token = context.getArgs()[0].handshake.headers.authorization.split(' ')[1];

        try {
            logger.debug(token);
            const user = await this.authService.validateToken(token);

            const data = context.getArgs()[1];
            data.username = user.username;
            data.pscope = user.pscope;
            
            return true;
        } catch(err) {
            logger.debug('[WsGuard] ' + err);
            return false;
        }
    }
    
}