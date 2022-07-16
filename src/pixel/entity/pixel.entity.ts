import { Entity, Schema } from "redis-om";

export class Pixel extends Entity {

    coord_x: number;
    coord_y: number;

    color: string;

    user: string;

    date: Date;
}

export const schema = new Schema(Pixel, {
    coord_x: {type: 'number'},
    coord_y: {type: 'number'},

    color: {type: 'string'},

    user: {type: 'string'},

    date: {type: 'date'}
}, {
    dataStructure: 'JSON'
});