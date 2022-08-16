import { Entity, Schema } from "redis-om";

export class User extends Entity {

    timer: number;

    lastPlacedPixel: Date;

    colors: string[];

    stickedPixelAvailable: number;

    bombAvailable: number;

    isUserGold: boolean;

    pixelsPlaced: number;

}

export const user_schema = new Schema(User, {

    timer: {type: 'number'},

    lastPlacedPixel: {type: 'date'},

    colors: {type: 'string[]'},

    stickedPixelAvailable: {type: 'number'},

    bombAvailable: {type: 'number'},

    isUserGold: {type: 'boolean'},

    pixelsPlaced: {type: 'number'}

});