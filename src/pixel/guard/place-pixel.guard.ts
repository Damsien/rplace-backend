import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { UserPayload } from "src/auth/type/userpayload.type";
import { GameService } from "src/game/game.service";
import { PixelHistoryService } from "src/pixel-history/pixel-history.service";
import { UserService } from "src/user/user.service";
import { logger } from "../../main";
import { PlaceSinglePixel } from "../dto/place-single-pixel.dto";

@Injectable()
export class PlacePixelGuard implements CanActivate {

    constructor(
        private readonly userService: UserService,
        private readonly gameService: GameService,
        private readonly pixelHistoryService: PixelHistoryService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

        try {
            const user: UserPayload = context.switchToHttp().getRequest().user;
            const userId = `${user.pscope}.${user.username}`;
            const pixel: PlaceSinglePixel = context.switchToHttp().getRequest().body;
            const game = await this.gameService.getGlobalGame();
            const pixelHistory = await this.pixelHistoryService.getLastPixelOfUser(userId);

            return this.userService.doUserIsRight(
                userId,
                pixel,
                game,
                new Date(),
                pixelHistory
            );

        } catch(err) {
            logger.debug(err);
            return false;
        }
    }
    
}