import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserPayload } from "../type/userpayload.type";

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt-access') {

    constructor() {
        super({
            secretOrKey: process.env.AT_SECRET,
            ignoreExpiration: false,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        });
    }

    async validate(payload: UserPayload): Promise<UserPayload> {

        const user = {
            username: payload.username,
            pscope: payload.pscope
        };

        return user;
    }

}