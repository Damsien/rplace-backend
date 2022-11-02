import { IsOptional, IsString } from "class-validator";

export class Group {

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    alternatives: string[];
}