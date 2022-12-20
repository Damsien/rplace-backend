import { Entity, Schema } from "redis-om";

export class Group extends Entity {

    name: string;

    pixelsPlaced: number;

}

export const group_schema = new Schema(Group, {

    name: {type: 'string'},

    pixelsPlaced: {type: 'number'},
});