import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { GameService } from "src/game/game.service";
import { logger } from "../../main";
import { PlacePatternPixel } from "../dto/place-pattern-pixel.dto";

@Injectable()
export class PatternShapeGuard implements CanActivate {

    constructor(private readonly gameService: GameService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

        try {

            const pixel: PlacePatternPixel = context.getArgs()[1].request.body;
            // white -> #FFFFFF
            pixel.color = await this.gameService.getAssociatedColor(pixel.color);

            return true;

        } catch(err) {
            logger.debug(err);
            return false;
        }
    }
    
}