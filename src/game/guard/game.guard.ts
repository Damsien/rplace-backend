import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { logger } from "src/main";

@Injectable()
export class GameGuard implements CanActivate {

    constructor(private schedulerRegistry: SchedulerRegistry) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {

        try {
            const startTimeout = this.schedulerRegistry.getTimeout('startGame');
            
            if(startTimeout == undefined || startTimeout == null) {
                return false;
            }

            if(!startTimeout.called) {
                // const timeLeft = (timeout._idleStart + timeout._idleTimeout - Date.now());
                return false;
            } else {
                const stopTimeout = this.schedulerRegistry.getTimeout('stopGame');

                if(stopTimeout == undefined || stopTimeout == null || stopTimeout.called) {
                    return false;
                }

                return true;
            }
        } catch(err) {
            logger.debug(err);
            return false;
        }
    }
    
}