import { Type } from "class-transformer";
import { IsInt } from "class-validator";

export class UpdateGameTimer {

    @IsInt()
    @Type(() => Number)
    timer: number;
    
}