import { Type } from "class-transformer";
import { IsDate, IsInt } from "class-validator";

export class PlaceSinglePixel {

    @IsInt()
    @Type(() => Number)
    coord_x: number;

    @IsInt()
    @Type(() => Number)
    coord_y: number;

    color: string;
    
}