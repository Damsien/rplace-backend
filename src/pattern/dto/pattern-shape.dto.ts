import { Type } from "class-transformer";
import { IsInt, IsString } from "class-validator";

export class PatternShape {

    @IsInt()
    @Type(() => Number)
    patternShapeId: number;

    @IsString()
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