import { Type } from "class-transformer";
import { IsInt } from "class-validator";

export class GetSinglePixel {

    @IsInt()
    @Type(() => Number)
    coord_x: number;

    @IsInt()
    @Type(() => Number)
    coord_y: number;
    
}