import { ForbiddenException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { logger } from "src/main";
import { AuthService } from "../auth.service";
import { UserPayload } from "../type/userpayload.type";

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {

    constructor(private readonly authService: AuthService) {
        super({
            secretOrKey: process.env.RT_SECRET,
            ignoreExpiration: false,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        });
    }

    async validate(payload: UserPayload): Promise<UserPayload> {

        const user = {
            username: payload.username,
            pscope: payload.pscope
        };

        await this.authService.validateTokens(user);

        return user;
    }
}