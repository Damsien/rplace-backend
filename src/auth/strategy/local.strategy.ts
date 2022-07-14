import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from "../auth.service";
import { UserPayload } from "../type/userpayload.type";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {

    constructor(private authService: AuthService) {
        super();
    }

    async validate(req): Promise<UserPayload> {
        const user = await this.authService.validateUser(req.body.username, req.body.password, req.body.pscope);

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }

}