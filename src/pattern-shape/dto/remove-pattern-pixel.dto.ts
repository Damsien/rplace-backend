import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";

export class RemovePatternPixel {

    @IsString()
    @IsOptional()
    patternId: string;

    @IsInt()
    @Type(() => Number)
    coord_x: number;

    @IsInt()
    @Type(() => Number)
    coord_y: number;

}