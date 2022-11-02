import { Type } from "class-transformer";
import { IsArray, IsDate, IsInt, IsNumber, IsOptional, IsString } from "class-validator";
import { Color } from "../type/color.type";
import { Step } from "../type/step.type";

export class StartGame {

    @IsString()
    gameMasterUsername: string;

    @IsArray()
    colors: Color[];

    @IsArray()
    steps: Step[];

    @IsInt()
    @Type(() => Number)
    timer: number;

    @IsDate()
    @Type(() => Date)
    schedule: Date

    @IsInt()
    @Type(() => Number)
    mapWidth: number;

    @IsArray()
    @IsOptional()
    blacklist: string[];

    @IsArray()
    @IsOptional()
    whitelist: string[];
    
}