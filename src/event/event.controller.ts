import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AtAuthGuard } from 'src/auth/guard/at-auth.guard';
import { EventGuard } from 'src/event/guard/event.guard';
import { EventService } from './event.service';

@Controller('event')
export class EventController {

    constructor(private readonly eventService: EventService) {}

    @UseGuards(EventGuard)
    @UseGuards(AtAuthGuard)
    @Post()
    registerNewEvent(@Request() req, @Body() event) {
        this.eventService.registerNewEvent(event, req.user);
    }

    /*  Body example
        "type": "map:increase",
        "values": [
            "gameMasterUsername:ddassieu", "width:20"
        ],
        "schedule": "1657983277"
    */

    @UseGuards(EventGuard)
    @UseGuards(AtAuthGuard)
    @Post()
    cancelEvent(@Request() req, @Body() event) {
        this.eventService.cancelRegisteredEvent(event, req.user);
    }

}
