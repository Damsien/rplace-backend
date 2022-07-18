import { Body, Controller, Post, UseGuards, Request, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { EventGuard } from 'src/event/guard/event.guard';
import { GameGuard } from 'src/game/guard/game.guard';
import { Repository } from 'typeorm';
import { EventCancel } from './dto/event-cancel.dto';
import { EventRegister } from './dto/event-register.dto';
import { EventEntity } from './entity/event.entity';
import { EventService } from './event.service';

@UseGuards(GameGuard)
@UseGuards(EventGuard)
@UseGuards(AtAuthGuard)
@Controller('event')
export class EventController {

    constructor(
        private readonly eventService: EventService,
        @InjectRepository(EventEntity) private eventRepo: Repository<EventEntity>
    ) {}

    @Post()
    async registerNewEvent(@Request() req, @Body() event: EventRegister) {
        this.eventService.registerNewEvent(event, req.user);

        const eventEntity = new EventEntity();
        eventEntity.type = event.type;
        eventEntity.userId = `${req.user.pscope}.${req.user.username}`;
        eventEntity.values = event.values;
        eventEntity.schedule = event.schedule;
        
        await this.eventRepo.insert(eventEntity);
    }

    @Delete()
    cancelEvent(@Request() req, @Body() event: EventCancel) {
        this.eventService.cancelRegisteredEvent(event, req.user);
    }

}
