import { Entity, Schema } from "redis-om";

export class Whitelist extends Entity {

    pscope: string;
    username: string;

}

export const whitelist_schema = new Schema(Whitelist, {

    pscope: {type: 'string'},

    username: {type: 'string'}

});