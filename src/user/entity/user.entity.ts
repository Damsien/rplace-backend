import { Entity, Schema } from "redis-om";

export class User extends Entity {

    timer: number;

    lastPlacedPixel: Date;

    colors: string[];

}

export const user_schema = new Schema(User, {

    timer: {type: 'number'},

    lastPlacedPixel: {type: 'date'},

    colors: {type: 'string[]'}

});