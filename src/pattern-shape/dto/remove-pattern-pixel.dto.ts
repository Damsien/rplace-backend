import { Type } from "class-transformer";
import { IsInt, IsString } from "class-validator";

export class RemovePatternPixel {

    @IsInt()
    @Type(() => Number)
    patternId: number;

    @IsInt()
    @Type(() => Number)
    coord_x: number;

    @IsInt()
    @Type(() => Number)
    coord_y: number;

}