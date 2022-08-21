import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsString } from "class-validator";

export class CreatePattern {

    @IsString()
    patternName: string;

}