import { IsDate, IsEnum, IsOptional, IsString } from "class-validator";
import { EventType } from "../entity/event.enum";

export class EventRegister {

    @IsString()
    @IsEnum(EventType)
    type: EventType;

    @IsString()
    values: string[];

    @IsDate()
    @IsOptional()
    schedule: Date = new Date();
    
}