import { IsArray } from "class-validator";

export class List {

    @IsArray()
    list: string[];
    
}