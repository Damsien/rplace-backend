import { Type } from "class-transformer";
import { IsArray, IsDate, IsEnum, IsOptional, IsString } from "class-validator";
import { EventType } from "../entity/event.enum";

export class EventRegister {

    @IsString()
    @IsEnum(EventType)
    type: EventType;

    @IsArray()
    values: string[];

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    schedule: Date = new Date();
    
}