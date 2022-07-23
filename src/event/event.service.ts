import { Injectable } from '@nestjs/common';
import { EventRegister } from './dto/event-register.dto';
import { EventType } from './entity/event.enum';
import { SchedulerRegistry } from '@nestjs/schedule';
import { logger } from 'src/main';
import { UserPayload } from 'src/auth/type/userpayload.type';
import { EventCancel } from './dto/event-cancel.dto';
import { EventEntity } from './entity/event.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PixelService } from 'src/pixel/pixel.service';
import { PixelHistoryService } from 'src/pixel-history/pixel-history.service';
import { RunnerService } from 'src/runner/runner.service';
import { UpdateGameMap } from './dto/update-game-map.dto';

@Injectable()
export class EventService {

    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly pixelService: PixelService,
        private readonly pixelHistoryService: PixelHistoryService,
        private readonly runnerService: RunnerService,
        @InjectRepository(EventEntity) private eventRepo: Repository<EventEntity>
    ) {}

    static findMsDifference(date1, date2) {    
        // Convert both dates to milliseconds
        var date1_ms = date1.getTime();
        var date2_ms = date2.getTime();
  
        // Calculate the difference in milliseconds
        var difference_ms = date2_ms - date1_ms;
          
        // Convert back to days and return
        return Math.round(difference_ms); 
    }

    /*      REGISTER NEW EVENT HERE     */

    registerNewEvent(event: EventRegister, user: UserPayload) {
        const milliseconds = EventService.findMsDifference(new Date(), event.schedule);

        const scheduleName = `${event.type}:${user.pscope}.${user.username}`;
  
        const timeout = setTimeout(async () => {
            switch (event.type) {

                case EventType.INCREASE_MAP: {
                    const dto = this.runnerService.register_increaseMap(event);
                    await this.runnerService.increaseMapSize(dto);
                } break;
                case EventType.UPDATE_TIMER: {
                    const dto = this.runnerService.register_updateTimer(event);
                    await this.runnerService.updateTimer(dto);
                } break;
                case EventType.UPDATE_COLORS: {
                    const dto = this.runnerService.register_updateColors(event);
                    await this.runnerService.updateColors(dto);
                } break;

            }
            this.schedulerRegistry.deleteTimeout(scheduleName);
            logger.log(`
            [Event] ${event.type} - Triggered at ${Date.now()} by ${user.pscope}.${user.username}`);
        }, milliseconds);
  
        this.schedulerRegistry.addTimeout(scheduleName, timeout);
    }

    async cancelRegisteredEvent(event: EventCancel, user: UserPayload) {
        const scheduleName = `${event.type}:${user.pscope}.${user.username}`;

        const timeout = this.schedulerRegistry.getTimeout(scheduleName);
        clearTimeout(timeout);
        this.schedulerRegistry.deleteTimeout(scheduleName);

        const eventEntity = await this.eventRepo.findOne({
            where: {type: event.type, userId: `${user.pscope}.${user.username}`}
        });
        await this.eventRepo.remove(eventEntity);
    }

}
