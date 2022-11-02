import { Entity, Schema } from "redis-om";

export class Blacklist extends Entity {

    pscope: string;
    username: string;

}

export const blacklist_schema = new Schema(Blacklist, {

    pscope: {type: 'string'},

    string: {type: 'string'}

});