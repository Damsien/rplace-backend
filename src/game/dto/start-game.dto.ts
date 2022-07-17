import { Type } from "class-transformer";
import { IsArray, IsDate, IsInt, IsNumber, IsString } from "class-validator";

export class StartGame {

    @IsString()
    name: string;

    @IsString()
    gameMasterUser: string

    @IsArray()
    colors: string[];

    @IsNumber()
    timer: number;

    @IsDate()
    @Type(() => Date)
    schedule: Date

    @IsInt()
    @Type(() => Number)
    mapWidth: number;
    
}