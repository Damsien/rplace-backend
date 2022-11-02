import { IsArray, IsOptional, IsString } from "class-validator";

export class Group {

    @IsString()
    name: string;

    @IsOptional()
    @IsArray()
    alternatives: string[];
}