import { IsString } from "class-validator";

export class CancelGame {

    @IsString()
    name: string;
    
}