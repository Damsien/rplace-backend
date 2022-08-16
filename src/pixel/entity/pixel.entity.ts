import { Entity, Schema } from "redis-om";

export class Pixel extends Entity {

    coord_x: number;
    coord_y: number;

    color: string;

    user: string;

    isUserGold: boolean;

    date: Date;

    isSticked: boolean;
}

export const pixel_schema = new Schema(Pixel, {
    coord_x: {type: 'number'},
    coord_y: {type: 'number'},

    color: {type: 'string'},

    user: {type: 'string'},

    isUserGold: {type: 'boolean'},

    date: {type: 'date'},

    isSticked: {type: 'boolean'}
}, {
    dataStructure: 'JSON'
});