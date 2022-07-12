import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/type/user.type';
import { UserService } from 'src/user/user.service';
import { Tokens } from './type/tokens.type';
import { UserPayload } from './type/userpayload.type';

@Injectable()
export class AuthService {

    constructor(private userService: UserService, private jwtService: JwtService) {}

    /* USED BY LOCAL GUARD */
    async validateUser(username: string, password: string): Promise<UserPayload> {
        const user = await this.userService.findOne(username);

        if (!user || user.password !== password) {
            return null;
        }

        const payload: UserPayload = { username: user.username, pscope: user.pscope };
        
        return payload;
    }

    async validateRefreshToken(rt: string): Promise<UserPayload> {
        this.jwtService.decode(rt, {
            c
        });

        
    }


    /* USED HAS URLS */

    async login(user): Promise<Tokens> {
        const payload: UserPayload = { username: user.username, pscope: user.pscope };

        return this.getTokens(payload);
    }

    async refreshToken(user): Promise<Tokens> {
        const payload: UserPayload = { username: user.username, pscope: user.pscope };

        return this.getTokens(payload);
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
