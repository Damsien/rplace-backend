import { Transform, TransformFnParams, Type } from "class-transformer";
import { IsInt, IsString } from "class-validator";

export class UpdateGameMap {

    @IsString()
    gameMasterUsername: string;

    @IsInt()
    @Type(() => Number)
    @Transform(({value}: TransformFnParams) => parseInt(value))
    width: number;
    
}