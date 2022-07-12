import { ForbiddenException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserPayload } from "../type/userpayload.type";

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt-access') {

    constructor() {
        super({
            secretOrKey: 'AT-SECRET',
            ignoreExpiration: false,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        });
    }

    validate(req: Request, payload: UserPayload): UserPayload {
        const accessToken = req.headers
          ?.get('authorization')
          ?.replace('Bearer', '')
          .trim();
    
        if (!accessToken) throw new ForbiddenException('Access token malformed');

        return payload;
    }

}