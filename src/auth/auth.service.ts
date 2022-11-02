import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'redis-om';
import { client } from 'src/app.service';
import { logger } from 'src/main';
import { User } from 'src/user/type/user.type';
import { UserService } from 'src/user/user.service';
import { isNullOrUndefined } from 'util';
import { Blacklist, blacklist_schema } from './entity/blacklist.entity';
import { Whitelist, whitelist_schema } from './entity/whitelist.entity';
import { JwtPayload } from './type/jwtpayload.type';
import { Tokens } from './type/tokens.type';
import { UserPayload } from './type/userpayload.type';

@Injectable()
export class AuthService {

    private whitelistRepo: Repository<Whitelist>;
    private blacklistRepo: Repository<Blacklist>;

    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private configService: ConfigService
    ) {}

    /*  CHECK WHITELIST AND BLACKLIST   */
    private async checkWhitelist(pscope: string, username: string): Promise<boolean> {
        return (await this.whitelistRepo.search()
            .where('pscope').eq(pscope)
            .and('username').eq(username)
            .return.first()) !== null;
    }

    private async checkBlacklist(pscope: string, username: string): Promise<boolean> {
        return (await this.blacklistRepo.search()
            .where('pscope').eq(pscope)
            .and('username').eq(username)
            .return.first()) !== null;
    }

    private async checkLists(pscope: string, username: string): Promise<boolean> {
        this.whitelistRepo = client.fetchRepository(whitelist_schema);
        this.blacklistRepo = client.fetchRepository(blacklist_schema);
        const isWhitelistActive = await this.whitelistRepo.search().returnCount() >= 1;

        try {
            if (isWhitelistActive) {
                if ((await this.checkWhitelist(pscope, username))) {
                    try {
                        if (!(await this.checkBlacklist(pscope, username))) {
                            return true;
                        }
                    } catch (err) {
                        // There is no blacklist
                        return true;
                    }
                }
            } else {
                if (await this.checkBlacklist(pscope, username)) {
                    return false;
                } else {
                    return true;
                }
            }
        } catch (err) {
            // There is no whitelist
            try {
                if (!(await this.checkBlacklist(pscope, username))) {
                    return true;
                }
            } catch (err) {
                // There is no blacklist
                return true;
            }
        }

        return false;
    }

    /* USED BY LOCAL GUARD */
    async validateUser(username: string, password: string, pscope: string): Promise<UserPayload> {
        if (!(await this.checkLists(pscope, username))) {
            throw new UnauthorizedException();
        }
        return await this.userService.checkUser(username, password, pscope);
    }

    /* USED BY WS GUARD */
    async validateToken(token: string) {
        const user = await this.jwtService.verify(token, {
            secret: this.configService.get<string>('AT_SECRET')
        });
        if (!(await this.checkLists(user.pscope, user.username))) {
            throw new UnauthorizedException();
        }
        return user;
    }

    /*  USED BY AT AND RT STRATEGIES    */
    async validateTokens(user: UserPayload) {
        if (!(await this.checkLists(user.pscope, user.username))) {
            throw new UnauthorizedException();
        }
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
