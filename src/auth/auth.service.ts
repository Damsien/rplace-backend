import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { logger } from 'src/main';
import { User } from 'src/user/type/user.type';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from './type/jwtpayload.type';
import { Tokens } from './type/tokens.type';
import { UserPayload } from './type/userpayload.type';

@Injectable()
export class AuthService {

    constructor(private userService: UserService, private jwtService: JwtService, private configService: ConfigService) {}

    /* USED BY LOCAL GUARD */
    async validateUser(username: string, password: string, pscope: string): Promise<UserPayload> {
        return await this.userService.checkUser(username, password, pscope);
    }

    /* USED BY WS GUARD */
    async validateToken(token: string) {
        return await this.jwtService.verify(token, {
            secret: this.configService.get<string>('AT_SECRET')
        });
    }


    /* USED HAS URLS */

    async loginOrRefresh(user: UserPayload): Promise<Tokens> {
        return await this.getTokens(user);
    }

    private async getTokens(payload: UserPayload): Promise<Tokens> {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('AT_SECRET'),
                expiresIn: '30m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('RT_SECRET'),
                expiresIn: '2h'
            })
        ]);

        return {
            access_token: at,
            refresh_token: rt
        };
    }

}
