import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from "../auth.service";
import { UserPayload } from "../type/userpayload.type";
import { UserService } from "src/user/user.service";
import { client } from "src/app.service";
import { User, user_schema } from "src/user/entity/user.entity";
import { Game, game_schema } from "src/game/entity/game.entity";
import { logger } from "src/main";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {

    constructor(private authService: AuthService, private userService: UserService) {
        super();
    }

    async validate(req): Promise<UserPayload> {

        const user = await this.authService.validateUser(req.body.username, req.body.password, req.body.pscope);
        // TODO
        // const user = {username: req.body.username, pscope: 'inp', password: null};

        if (!user) {
            throw new UnauthorizedException();
        }
        const userId = `${user.pscope}.${user.username}`;

        /*    Redis   */
        const userRepo = client.fetchRepository(user_schema);
        await userRepo.createIndex();
        const userRedis: User = await userRepo.fetch(userId);
        if (userRedis.isUserGold == null || userRedis.lastPlacedPixel == null) {

            userRedis.isUserGold = false;
            userRedis.pixelsPlaced = 0;
            userRedis.stickedPixelAvailable = 0;
            userRedis.bombAvailable = 0;

            const gameRepo = client.fetchRepository(game_schema);
            const game: Game = await gameRepo.search().where('name').eq('Game').return.first();
            let offset = 30;
            if (game != undefined) {
                offset = game.timer;
            }

            const now: number = new Date().getTime();
            const nowMinusOffset = new Date(now-offset*1000);
            userRedis.lastPlacedPixel = nowMinusOffset;

            await userRepo.save(userRedis);
        }
        
        await this.userService.createUserIfNotExists({
            username: req.body.username,
            pscope: req.body.pscope,
            password: req.body.password
        });

        return user;
    }

}