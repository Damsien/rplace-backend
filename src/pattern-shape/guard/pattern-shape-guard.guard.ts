import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { GameService } from "src/game/game.service";
import { PatternService } from "src/pattern/pattern.service";
import { logger } from "../../main";
import { PlacePatternPixel } from "../dto/place-pattern-pixel.dto";

@Injectable()
export class PatternShapeGuard implements CanActivate {

    constructor(private readonly gameService: GameService, private readonly patternService: PatternService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

        try {

            const request = context.getArgs()[1];
            const userId = `${request.request.user.pscope}.${request.request.user.username}`;
            const patternId = request.request.params['patternId'];
            const patterns = (await this.patternService.getAllUserPatterns(userId)).self;

            if (patterns.find((el) => el.patternId == patternId) === undefined) {
                return false;
            }

            try {
                const pixel: PlacePatternPixel = request.request.body;
                // white -> #FFFFFF
                pixel.color = await this.gameService.getAssociatedColor(pixel.color);
            } catch (e) {
                // remove pixel so there is no body to resolve
            }

            return true;

        } catch(err) {
            logger.debug(err);
            return false;
        }
    }
    
}