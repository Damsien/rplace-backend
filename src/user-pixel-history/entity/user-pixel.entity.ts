import { Entity, Schema } from "redis-om";

export class UserPixel extends Entity {

    coord_x: number;
    coord_y: number;

    color: string;
    date: Date;
}

export const schema = new Schema(UserPixel, {
    coord_x: {type: 'number'},
    coord_y: {type: 'number'},

    color: {type: 'string'},

    date: {type: 'date'}
}, {
    dataStructure: 'JSON'
});