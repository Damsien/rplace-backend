import { Type } from "class-transformer";
import { IsInt, IsString } from "class-validator";

export class UpdateGameMap {

    @IsString()
    gameMasterUsername: string;

    @IsInt()
    @Type(() => Number)
    width: number;
    
}