import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { logger } from "src/main";

@Injectable()
export class GameGuard implements CanActivate {

    constructor(private schedulerRegistry: SchedulerRegistry) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

        try {
            const startTimeout = this.schedulerRegistry.getTimeout('startGame');

            const timeLeft = Math.ceil((startTimeout._idleStart + startTimeout._idleTimeout)/1000 - process.uptime());
            if(timeLeft >= 0) {
                return false;
            } else {

                try {
                    const stopTimeout = this.schedulerRegistry.getTimeout('stopGame');
    
                    if(stopTimeout == undefined || stopTimeout == null || stopTimeout.called) {
                        return false;
                    }

                    return true;
                } catch (err) {
                    logger.debug('StopTimeout but startTimeout is fine not found');
                    return  true;
                }
            }
        } catch(err) {
            logger.debug('StartTimeout not found');
            return false;
        }
    }
    
}