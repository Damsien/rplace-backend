import { Type } from "class-transformer";
import { IsDate, IsInt, IsString } from "class-validator";

export class UpdateGameMap {

    @IsString()
    gameMasterUsername: string

    @IsDate()
    schedule: Date

    @IsInt()
    @Type(() => Number)
    width: number;
    
}