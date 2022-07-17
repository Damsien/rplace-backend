import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { EventGuard } from 'src/event/guard/event.guard';
import { Repository } from 'typeorm';
import { EventEntity } from './entity/event.entity';
import { EventService } from './event.service';

@Controller('event')
export class EventController {

    constructor(
        private readonly eventService: EventService,
        @InjectRepository(EventEntity) private eventRepo: Repository<EventEntity>
    ) {}

    @UseGuards(EventGuard)
    @UseGuards(AtAuthGuard)
    @Post()
    async registerNewEvent(@Request() req, @Body() event) {
        this.eventService.registerNewEvent(event, req.user);

        const eventEntity = new EventEntity();
        eventEntity.type = event.type;
        eventEntity.user = `${req.user.pscope}.${req.user.username}`;
        eventEntity.values = event.values;
        eventEntity.schedule = event.schedule;
        
        await this.eventRepo.insert(eventEntity);
    }

    @UseGuards(EventGuard)
    @UseGuards(AtAuthGuard)
    @Post()
    cancelEvent(@Request() req, @Body() event) {
        this.eventService.cancelRegisteredEvent(event, req.user);
    }

}
