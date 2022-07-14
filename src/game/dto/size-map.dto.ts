import { Type } from "class-transformer";
import { IsInt } from "class-validator";

export class SizeMap {

    @IsInt()
    @Type(() => Number)
    width: number;
    
}