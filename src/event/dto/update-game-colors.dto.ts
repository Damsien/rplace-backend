import { IsArray } from "class-validator";

export class UpdateGameColors {

    @IsArray()
    colors: string[];
    
}