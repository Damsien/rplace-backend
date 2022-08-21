import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsString } from "class-validator";

export class PlacePatternPixel {

    @IsInt()
    @Type(() => Number)
    patternId: number;

    @IsInt()
    @Type(() => Number)
    coord_x: number;

    @IsInt()
    @Type(() => Number)
    coord_y: number;

    @IsString()
    color: string;

}