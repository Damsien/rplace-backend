import { Type } from "class-transformer";
import { IsInt, IsString } from "class-validator";

export class PatternShape {

    @IsInt()
    @Type(() => Number)
    patternShapeId: number;

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