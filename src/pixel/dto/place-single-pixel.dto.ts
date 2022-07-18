import { Type } from "class-transformer";
import { IsInt, IsString } from "class-validator";

export class PlaceSinglePixel {

    @IsInt()
    @Type(() => Number)
    coord_x: number;

    @IsInt()
    @Type(() => Number)
    coord_y: number;

    @IsString()
    color: string;
 
    @IsString()
    username: string;

    @IsString()
    pscope: string;

}