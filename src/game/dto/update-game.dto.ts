import { IsArray, IsNumber, IsOptional } from "class-validator";


export class UpdateGame {

    @IsOptional()
    @IsNumber()
    timer: number;

    @IsOptional()
    @IsArray()
    colors: string[];
}