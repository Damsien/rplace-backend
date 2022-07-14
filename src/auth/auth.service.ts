import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { logger } from 'src/main';
import { User } from 'src/user/type/user.type';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from './type/jwtpayload.type';
import { Tokens } from './type/tokens.type';
import { UserPayload } from './type/userpayload.type';

@Injectable()
export class AuthService {

    constructor(private userService: UserService, private jwtService: JwtService) {}

    /* USED BY LOCAL GUARD */

    async validateUser(username: string, password: string, pscope: string): Promise<UserPayload> {
        return await this.userService.checkUser(username, password, pscope);
    }


    /* USED HAS URLS */

    async loginOrRefresh(user: UserPayload): Promise<Tokens> {
        return await this.getTokens(user);
    }

    private async getTokens(payload: UserPayload): Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: 'AT-SECRET',
                expiresIn: '30m',
            }),
            this.jwtService.signAsync(payload, {
                secret: 'RT-SECRET',
                expiresIn: '1d'
            })
        ]);

        return {
            access_token: at,
            refresh_token: rt
        };
    }

}
