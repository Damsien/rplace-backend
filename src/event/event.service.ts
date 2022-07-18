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
import { EventTriggerService } from './event-trigger.service';

@Injectable()
export class EventService {

    constructor(
        private readonly eventTriggerService: EventTriggerService,
        private readonly schedulerRegistry: SchedulerRegistry,
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
    private registerEventFromType(event: EventRegister): [Function, any] {
        switch (event.type) {

            case EventType.INCREASE_MAP: return this.eventTriggerService.register_increaseMap(event);
            case EventType.UPDATE_TIMER: return this.eventTriggerService.register_updateTimer(event);
            case EventType.UPDATE_COLORS: return this.eventTriggerService.register_updateColors(event);

        }
    }

    registerNewEvent(event: EventRegister, user: UserPayload) {
        const milliseconds = EventService.findMsDifference(new Date(), event.schedule);

        const [func, dto] = this.registerEventFromType(event);
        const scheduleName = `${event.type}:${user.pscope}.${user.username}`;
  
        const timeout = setTimeout(() => {
            func.call(dto);
            this.schedulerRegistry.deleteTimeout(scheduleName);
            logger.log(`[Event] ${event.type} - Triggered at ${Date.now()} with values :
                ${dto}
                by ${user.pscope}.${user.username}`);
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
