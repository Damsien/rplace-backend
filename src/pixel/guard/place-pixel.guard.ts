import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { client } from "src/app.service";
import { UserPayload } from "src/auth/type/userpayload.type";
import { GameService } from "src/game/game.service";
import { PixelHistoryService } from "src/pixel-history/pixel-history.service";
import { User, user_schema } from "src/user/entity/user.entity";
import { UserService } from "src/user/user.service";
import { logger } from "../../main";
import { PlaceSinglePixel } from "../dto/place-single-pixel.dto";

@Injectable()
export class PlacePixelGuard implements CanActivate {

    constructor(
        private readonly userService: UserService,
        private readonly gameService: GameService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const userRepo = client.fetchRepository(user_schema);

        try {
            const pixel: PlaceSinglePixel = context.getArgs()[1];
            const userId = `${pixel.pscope}.${pixel.username}`;
            const game = await this.gameService.getGlobalGameSpec();
            const user: User = await userRepo.fetch(userId);
            const lastPlacedPixelDate = user.lastPlacedPixel;
            const offset = (user.timer == undefined ? game.timer : user.timer);
            const colors = [...game.colors, ...user.colors];

            return this.userService.doUserIsRight({
                userId: userId,
                pixel: pixel,
                game: game,
                date: new Date(),
                lastPlacedPixelDate: lastPlacedPixelDate,
                offset: offset,
                colors: colors
            });

        } catch(err) {
            logger.debug(err);
            return false;
        }
    }
    
}