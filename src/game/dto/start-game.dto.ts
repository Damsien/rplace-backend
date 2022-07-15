import { Type } from "class-transformer";
import { IsDate, IsInt, IsString } from "class-validator";

export class StartGame {

    @IsString()
    gameMasterUsername: string

    @IsDate()
    @Type(() => Date)
    schedule: Date

    @IsInt()
    @Type(() => Number)
    mapWidth: number;
    
}