import { Type } from "class-transformer";
import { IsDate, IsInt, IsString } from "class-validator";

export class StopGame {

    @IsDate()
    schedule: Date
    
}