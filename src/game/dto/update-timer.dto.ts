import { Type } from "class-transformer";
import { IsDate, IsInt, IsString } from "class-validator";

export class UpdateTimer {

    @IsDate()
    schedule: Date

    @IsInt()
    @Type(() => Number)
    timer: number;  // in second
    
}