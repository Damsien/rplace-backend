import { Type } from "class-transformer";
import { IsDate, IsInt, IsString } from "class-validator";

export class StopGame {

    @IsString()
    name: string;

    @IsDate()
    schedule: Date
    
}