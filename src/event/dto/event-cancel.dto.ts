import { Type } from "class-transformer";
import { IsDate, IsEnum, IsString } from "class-validator";
import { EventType } from "../entity/event.enum";

export class EventCancel {

    @IsString()
    @IsEnum(EventType)
    type: EventType;

    @IsDate()
    @Type(() => Date)
    scheduled: Date;
    
}