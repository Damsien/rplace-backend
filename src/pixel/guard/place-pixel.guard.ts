import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { client } from "src/app.service";
import { UserPayload } from "src/auth/type/userpayload.type";
import { GameService } from "src/game/game.service";
import { PixelHistoryService } from "src/pixel-history/pixel-history.service";
import { User, user_schema } from "src/user/entity/user.entity";
import { UserGateway } from "src/user/user.gateway";
import { UserService } from "src/user/user.service";
import { logger } from "../../main";
import { PlaceSinglePixel } from "../dto/place-single-pixel.dto";
import { Pixel, pixel_schema } from "../entity/pixel.entity";

@Injectable()
export class PlacePixelGuard implements CanActivate {

    constructor(
        private readonly userService: UserService,
        private readonly gameService: GameService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const userRepo = client.fetchRepository(user_schema);
        const pixelRepo = client.fetchRepository(pixel_schema);

        try {
            const pixel: PlaceSinglePixel = context.getArgs()[1];
            const oldPixel: Pixel = await pixelRepo.search()
                .where('coord_x').eq(pixel.coord_x).and('coord_y').eq(pixel.coord_y)
                .return.first();
            const userId = `${pixel.pscope}.${pixel.username}`;
            const game = await this.gameService.serverGetGlobalGameSpec();
            const user: User = await userRepo.fetch(userId);
            context.switchToHttp().getRequest().user = user;
            const lastPlacedPixelDate = user.lastPlacedPixel;
            const offset = (user.timer == undefined ? game.timer : user.timer);
            const colors = user.getColorsName() == null ? game.colors : [...game.colors, ...user.getColorsName()];
            const stickedPixelsAvalaible = user.stickedPixelAvailable;

            // Check if the user have right to place pixel
            let isRight = this.userService.doUserIsRight({
                userId: userId,
                pixel: pixel,
                oldPixel: oldPixel,
                stickedPixelAvailable: stickedPixelsAvalaible,
                game: game,
                date: new Date(),
                lastPlacedPixelDate: lastPlacedPixelDate,
                offset: offset,
                colors: colors
            });

            // white -> #FFFFFF
            pixel.color = (await this.gameService.getAssociatedColor(pixel.color)) ?? (await this.userService.getAssociatedColor(pixel.color, userId));

            return isRight;

        } catch(err) {
            logger.debug(err);
            return false;
        }
    }
    
}