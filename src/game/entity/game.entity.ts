import { Entity, Schema } from "redis-om";


export class Game extends Entity {

    name: string;

    startSchedule: Date;

    stopSchedule: Date;

    timer: number;

    colors: string[];

}

export const game_schema = new Schema(Game, {

    name: {type: 'string'},

    startSchedule: {type: 'date'},

    stopSchedule: {type: 'date'},

    timer: {type: 'number'},

    colors: {type: 'string[]'},

});