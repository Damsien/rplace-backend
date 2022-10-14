import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class PlacePatternPixel {

    @IsString()
    @IsOptional()
    patternId: string;

    @IsInt()
    @Type(() => Number)
    coord_x: number;

    @IsInt()
    @Type(() => Number)
    coord_y: number;

    @IsString()
    color: string;

}