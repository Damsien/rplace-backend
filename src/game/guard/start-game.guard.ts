import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { client } from "src/app.service";
import { logger } from "src/main";
import { Game, game_schema } from "src/game/entity/game.entity";

@Injectable()
export class StartGameGuard implements CanActivate {

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const repo = client.fetchRepository(game_schema);
        const game: Game = await repo.search().where('name').eq('Game').return.first();

        try {
            if (game != undefined) {

                const now = new Date();
                if (game.startSchedule >= now) {
                    return false;
                } else {
                    return true;
                }
            }
        } catch(err) {
            logger.debug('StartTimeout not found');
            return false;
        }
    }
    
}