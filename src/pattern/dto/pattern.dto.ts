import { Type } from "class-transformer";
import { IsInt, IsString } from "class-validator";

export class Pattern {

    @IsInt()
    @Type(() => Number)
    patternId: number;

    @IsString()
    name: string;

    @IsString()
    userId: string;

}